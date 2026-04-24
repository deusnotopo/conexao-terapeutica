import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { webAlert } from '../lib/webAlert';
import { profileService } from '../services/profileService';
import { dependentService } from '../services/dependentService';
import { syncService } from '../services/syncService';
import { authService } from '../services/authService';
import { Profile, Dependent } from '../lib/schemas';
import type { User } from '@supabase/supabase-js';
import { Result } from '../lib/result';

// ─── Context Shape ────────────────────────────────────────────────────────────

type UserContextType = {
  user: User | null;
  profile: Profile | null;
  dependents: Dependent[];
  activeDependent: Dependent | null;
  setActiveDependent: (dep: Dependent | null) => void;
  loading: boolean;
  refreshContext: () => void;
  updateProfile: (data: Partial<Profile>) => Promise<Result<Profile>>;
  updateAvatar: (fileBody: File | Blob, fileExt: string) => Promise<Result<Profile>>;
  addDependent: (data: Partial<Dependent>) => Promise<Result<Dependent>>;
  editDependent: (id: string, data: Partial<Dependent>) => Promise<Result<Dependent>>;
  removeDependent: (id: string) => Promise<Result<{ deletedId: string }>>;
  logout: () => Promise<Result<true>>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [activeDependent, setActiveDependent] = useState<Dependent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchProfileAndDependents(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        fetchProfileAndDependents(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setDependents([]);
        setActiveDependent(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfileAndDependents = async (userId: string, forceRefresh = false) => {
    if (!userId) return;

    try {
      if (forceRefresh) {
        // Se forceRefresh = true, aguarda o banco de dados MESMO (evita race conditions no Onboarding)
        const [freshProfile, freshDependents] = await Promise.all([
          profileService.getProfile(userId, { forceRefresh: true }),
          dependentService.getDependents(userId, { forceRefresh: true }),
        ]);
        
        if (freshProfile.success) setProfile(freshProfile.data as Profile);
        
        if (freshDependents.success) {
          setDependents(freshDependents.data as Dependent[]);
          if (!activeDependent && (freshDependents.data as Dependent[])?.length > 0) {
            setActiveDependent((freshDependents.data as Dependent[])[0]);
          }
        }
        return;
      }

      // Comportamento normal: mostra o cache rápido, depois revalida
      const [cacheProfile, cacheDependents] = await Promise.all([
        profileService.getProfile(userId, { forceRefresh: false }),
        dependentService.getDependents(userId, { forceRefresh: false }),
      ]);

      if (cacheProfile.success) setProfile(cacheProfile.data as Profile);
      if (cacheDependents.success) {
        setDependents(cacheDependents.data as Dependent[]);
        if (!activeDependent && (cacheDependents.data as Dependent[])?.length > 0) {
          setActiveDependent((cacheDependents.data as Dependent[])[0]);
        }
      }

      // Background revalidation
      Promise.all([
        profileService.getProfile(userId, { forceRefresh: true }),
        dependentService.getDependents(userId, { forceRefresh: true }),
      ]).then(([freshProfile, freshDependents]) => {
        if (freshProfile.success && !(freshProfile.metadata as { fromCache?: boolean })?.fromCache) {
          setProfile(freshProfile.data as Profile);
        }
        if (freshDependents.success && !(freshDependents.metadata as { fromCache?: boolean })?.fromCache) {
          setDependents(freshDependents.data as Dependent[]);
          if (!activeDependent && (freshDependents.data as Dependent[])?.length > 0) {
            setActiveDependent((freshDependents.data as Dependent[])[0]);
          }
        }
      });
    } catch (error) {
      console.error('UserContext: Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<Profile>): Promise<Result<Profile>> => {
    const result = await syncService.perform('profileService', 'updateProfile', [user!.id, data]);
    if (result.success) {
      if (!(result.metadata as { enqueued?: boolean })?.enqueued) {
        setProfile(result.data as Profile);
      } else {
        setProfile((prev) => prev ? { ...prev, ...data } : prev);
      }
    }
    return result as Result<Profile>;
  };

  const updateAvatar = async (fileBody: File | Blob, fileExt: string): Promise<Result<Profile>> => {
    const result = await syncService.perform('profileService', 'uploadAvatar', [user!.id, fileBody, fileExt]);
    if (result.success && !(result.metadata as { enqueued?: boolean })?.enqueued) {
      setProfile(result.data as Profile);
    }
    return result as Result<Profile>;
  };

  const addDependent = async (data: Partial<Dependent>): Promise<Result<Dependent>> => {
    const depData = { ...data, user_id: user!.id };
    const result = await syncService.perform('dependentService', 'createDependent', [depData]);
    if (result.success) fetchProfileAndDependents(user!.id);
    return result as Result<Dependent>;
  };

  const editDependent = async (id: string, data: Partial<Dependent>): Promise<Result<Dependent>> => {
    const result = await syncService.perform('dependentService', 'updateDependent', [id, data]);
    if (result.success) fetchProfileAndDependents(user!.id);
    return result as Result<Dependent>;
  };

  const removeDependent = async (id: string): Promise<Result<{ deletedId: string }>> => {
    const result = await syncService.perform('dependentService', 'deleteDependent', [id]);
    if (result.success) fetchProfileAndDependents(user!.id);
    return result as Result<{ deletedId: string }>;
  };

  const logout = async (): Promise<Result<true>> => {
    return await authService.signOut();
  };

  return (
    <UserContext.Provider
      value={{
        user,
        profile,
        dependents,
        activeDependent,
        setActiveDependent,
        loading,
        refreshContext: () => fetchProfileAndDependents(user?.id ?? '', true),
        updateProfile,
        updateAvatar,
        addDependent,
        editDependent,
        removeDependent,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useUser = (): UserContextType => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
};
