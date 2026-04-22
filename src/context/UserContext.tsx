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

  const fetchProfileAndDependents = async (userId: string) => {
    if (!userId) return;

    try {
      const [cacheProfile, cacheDependents] = await Promise.all([
        profileService.getProfile(userId, { forceRefresh: false }),
        dependentService.getDependents(userId, { forceRefresh: false }),
      ]);

      if (cacheProfile.success && cacheProfile.data && cacheProfile.metadata?.fromCache) {
        setProfile(cacheProfile.data);
      }
      if (cacheDependents.success && cacheDependents.data && cacheDependents.metadata?.fromCache) {
        const deps = cacheDependents.data;
        setDependents(deps);
        if (deps.length > 0 && !activeDependent) setActiveDependent(deps[0]);
        setLoading(false);
      }

      const [netProfile, netDependents] = await Promise.all([
        profileService.getProfile(userId, { forceRefresh: true }),
        dependentService.getDependents(userId, { forceRefresh: true }),
      ]);

      if (netProfile.success && netProfile.data) setProfile(netProfile.data);
      if (netDependents.success && netDependents.data) {
        const deps = netDependents.data;
        setDependents(deps);
        setActiveDependent((prev) => {
          if (!prev && deps.length > 0) return deps[0];
          if (!prev) return null;
          return deps.find((d) => d.id === prev.id) || deps[0];
        });
      }
    } catch {
      if (!profile && dependents.length === 0) {
        webAlert('Aviso', 'Não foi possível carregar seus dados no momento.');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<Profile>): Promise<Result<Profile>> => {
    const result = await syncService.perform('profileService', 'updateProfile', [user!.id, data]);
    if (result.success) {
      if (!result.metadata?.enqueued) {
        setProfile(result.data);
      } else {
        setProfile((prev) => prev ? { ...prev, ...data } : prev);
      }
    }
    return result;
  };

  const updateAvatar = async (fileBody: File | Blob, fileExt: string): Promise<Result<Profile>> => {
    const result = await syncService.perform('profileService', 'uploadAvatar', [user!.id, fileBody, fileExt]);
    if (result.success && !result.metadata?.enqueued) {
      setProfile(result.data);
    }
    return result;
  };

  const addDependent = async (data: Partial<Dependent>): Promise<Result<Dependent>> => {
    const depData = { ...data, user_id: user!.id };
    const result = await syncService.perform('dependentService', 'createDependent', [depData]);
    if (result.success) fetchProfileAndDependents(user!.id);
    return result;
  };

  const editDependent = async (id: string, data: Partial<Dependent>): Promise<Result<Dependent>> => {
    const result = await syncService.perform('dependentService', 'updateDependent', [id, data]);
    if (result.success) fetchProfileAndDependents(user!.id);
    return result;
  };

  const removeDependent = async (id: string): Promise<Result<{ deletedId: string }>> => {
    const result = await syncService.perform('dependentService', 'deleteDependent', [id]);
    if (result.success) fetchProfileAndDependents(user!.id);
    return result;
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
        refreshContext: () => fetchProfileAndDependents(user?.id ?? ''),
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
