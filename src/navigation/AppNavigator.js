import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { UserProvider, useUser } from '../context/UserContext';
import { Toast } from '../components/Toast';
import { colors } from '../theme';

// Nests
import { MainTabs } from './MainTabs';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { TutorialScreen } from '../screens/auth/TutorialScreen';
import { NotificationsScreen } from '../screens/main/NotificationsScreen';
import { EditDependentScreen } from '../screens/main/EditDependentScreen';
import { AddEventScreen } from '../screens/main/AddEventScreen';
import { AddMedicationScreen } from '../screens/main/AddMedicationScreen';
import { UploadDocScreen } from '../screens/main/UploadDocScreen';
import { MedicalRecordScreen } from '../screens/main/MedicalRecordScreen';
import { ConsultationsScreen } from '../screens/main/ConsultationsScreen';
import { AddConsultationScreen } from '../screens/main/AddConsultationScreen';
import { ExpensesScreen } from '../screens/main/ExpensesScreen';
import { AddExpenseScreen } from '../screens/main/AddExpenseScreen';
import { GoalsScreen } from '../screens/main/GoalsScreen';
import { AddGoalScreen } from '../screens/main/AddGoalScreen';
import { MedicationsScreen } from '../screens/main/MedicationsScreen';
import { VaccinesScreen } from '../screens/main/VaccinesScreen';
import { AddVaccineScreen } from '../screens/main/AddVaccineScreen';
import { ParentDiaryScreen } from '../screens/main/ParentDiaryScreen';
import { WellbeingScreen } from '../screens/main/WellbeingScreen';
import { EditEventScreen } from '../screens/main/EditEventScreen';
import { ProfessionalsScreen } from '../screens/main/ProfessionalsScreen';
import { AddProfessionalScreen } from '../screens/main/AddProfessionalScreen';
import { EmergencyScreen } from '../screens/main/EmergencyScreen';
import { CrisisScreen } from '../screens/main/CrisisScreen';
import { AddCrisisScreen } from '../screens/main/AddCrisisScreen';
import { GrowthScreen } from '../screens/main/GrowthScreen';
import { AddGrowthScreen } from '../screens/main/AddGrowthScreen';
import { BenefitsScreen } from '../screens/main/BenefitsScreen';
import { SleepScreen } from '../screens/main/SleepScreen';
import { AddSleepScreen } from '../screens/main/AddSleepScreen';
import { CaregiverScreen } from '../screens/main/CaregiverScreen';
import { MedicationAdherenceScreen } from '../screens/main/MedicationAdherenceScreen';

const Stack = createStackNavigator();

const NavigationContent = () => {
    const { user, loading, dependents } = useUser();

    if (loading) {
        return null; // or a Splash Screen
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    // Usuário deslogado
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Tutorial" component={TutorialScreen} />
                    </>
                ) : dependents.length === 0 ? (
                    // Usuário logado mas sem dependentes — mostra Tutorial primeiro
                    <>
                        <Stack.Screen name="Tutorial" component={TutorialScreen} />
                        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                    </>
                ) : (
                    // Fluxo normal
                    <>
                        <Stack.Screen name="MainTabs" component={MainTabs} />
                        <Stack.Screen 
                            name="AddEvent" 
                            component={AddEventScreen} 
                            options={{ presentation: 'modal' }}
                        />
                        <Stack.Screen 
                            name="AddMedication" 
                            component={AddMedicationScreen} 
                            options={{ presentation: 'modal' }}
                        />
                        <Stack.Screen name="UploadDoc" component={UploadDocScreen} options={{ presentation: 'modal' }} />
                        <Stack.Screen name="MedicalRecord" component={MedicalRecordScreen} />
                        <Stack.Screen name="Consultations" component={ConsultationsScreen} />
                        <Stack.Screen name="AddConsultation" component={AddConsultationScreen} options={{ presentation: 'modal' }} />
                        <Stack.Screen name="Expenses" component={ExpensesScreen} />
                        <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ presentation: 'modal' }} />
                        <Stack.Screen name="Goals" component={GoalsScreen} />
                        <Stack.Screen name="AddGoal" component={AddGoalScreen} options={{ presentation: 'modal' }} />
                        <Stack.Screen name="Medications" component={MedicationsScreen} />
                        <Stack.Screen name="Vaccines" component={VaccinesScreen} />
                        <Stack.Screen name="AddVaccine" component={AddVaccineScreen} options={{ presentation: 'modal' }} />
                        <Stack.Screen name="ParentDiary" component={ParentDiaryScreen} />
                        <Stack.Screen name="Wellbeing" component={WellbeingScreen} />
                        <Stack.Screen name="EditEvent" component={EditEventScreen} options={{ presentation: 'modal' }} />
                        <Stack.Screen name="Professionals" component={ProfessionalsScreen} />
                        <Stack.Screen name="AddProfessional" component={AddProfessionalScreen} options={{ presentation: 'modal' }} />
                        <Stack.Screen name="Emergency" component={EmergencyScreen} />
                        <Stack.Screen name="Crisis" component={CrisisScreen} />
                        <Stack.Screen name="AddCrisis" component={AddCrisisScreen} options={{ presentation: 'modal' }} />
                        <Stack.Screen name="Growth" component={GrowthScreen} />
                        <Stack.Screen name="AddGrowth" component={AddGrowthScreen} options={{ presentation: 'modal' }} />
                        <Stack.Screen name="Benefits" component={BenefitsScreen} />
                        <Stack.Screen name="Sleep" component={SleepScreen} />
                        <Stack.Screen name="AddSleep" component={AddSleepScreen} options={{ presentation: 'modal' }} />
                        <Stack.Screen name="Caregiver" component={CaregiverScreen} />
                        <Stack.Screen name="MedicationAdherence" component={MedicationAdherenceScreen} />
                        <Stack.Screen name="Tutorial" component={TutorialScreen} options={{ presentation: 'modal' }} />
                    </>
                )}
                <Stack.Screen name="Notifications" component={NotificationsScreen} />
                <Stack.Screen name="EditDependent" component={EditDependentScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export const AppNavigator = () => {
    return (
        <UserProvider>
            <View style={styles.root}>
                <View style={styles.container}>
                    <NavigationContent />
                    <Toast />
                </View>
            </View>
        </UserProvider>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: colors.background,
        overflow: 'hidden',
    },
});
