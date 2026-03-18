import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { webAlert } from '../lib/webAlert';

const UserContext = createContext({});

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [dependents, setDependents] = useState([]);
    const [activeDependent, setActiveDependent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initialize session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setUser(session.user);
                fetchProfileAndDependents(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
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

    const fetchProfileAndDependents = async (userId) => {
        try {
            // Fetch profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError) {
                webAlert('Aviso', 'Perfil principal não encontrado. Contate o suporte ou atualize a página.');
                throw profileError;
            }
            setProfile(profileData);

            // Fetch dependents (primary + shared)
            const { data: primaryDependents, error: primaryError } = await supabase
                .from('dependents')
                .select('*')
                .eq('primary_user_id', userId);

            if (primaryError) {
                webAlert('Aviso', 'Erro ao carregar os dependentes: ' + primaryError.message);
                throw primaryError;
            }

            // Simple merge or strategy for fetching shared ones if needed in future
            // For now, focus on primary
            setDependents(primaryDependents || []);
            
            if (primaryDependents && primaryDependents.length > 0) {
                setActiveDependent(primaryDependents[0]);
            } else {
                // Se chegou aqui após um insert (como no Cadastro), significa que a Inserção funcionou,
                // mas a Busca (SELECT) veio vazia. Possível erro de segurança de RLS no banco de dados.
                console.log("No dependents found for user: ", userId);
            }
        } catch (error) {
            console.error('Error fetching user context:', error);
            webAlert('Erro Interno', 'Falha ao sincronizar seus dados. Tente fazer login novamente: ' + (error?.message || ''));
        } finally {
            setLoading(false);
        }
    };

    return (
        <UserContext.Provider value={{
            user,
            profile,
            dependents,
            activeDependent,
            setActiveDependent,
            loading,
            refreshContext: () => fetchProfileAndDependents(user?.id)
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
