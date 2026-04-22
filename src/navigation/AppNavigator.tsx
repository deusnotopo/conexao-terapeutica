import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { UserProvider, useUser } from '../context/UserContext';
import { ThemeProvider } from '../context/ThemeContext';
import { Toast } from '../components/Toast';
import { colors } from '../theme';

// Nests
import { MainTabs } from './MainTabs';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { TutorialScreen } from '../screens/auth/TutorialScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { NotificationsScreen } from '../screens/main/NotificationsScreen';
import { EditDependentScreen } from '../screens/main/EditDependentScreen';
import { EventFormScreen } from '../screens/main/EventFormScreen';
import { MedicationFormScreen } from '../screens/main/MedicationFormScreen';
import { UploadDocScreen } from '../screens/main/UploadDocScreen';
import { MedicalRecordScreen } from '../screens/main/MedicalRecordScreen';
import { ConsultationsScreen } from '../screens/main/ConsultationsScreen';
import { ConsultationFormScreen } from '../screens/main/ConsultationFormScreen';
import { ExpensesScreen } from '../screens/main/ExpensesScreen';
import { ExpenseFormScreen } from '../screens/main/ExpenseFormScreen';
import { GoalsScreen } from '../screens/main/GoalsScreen';
import { GoalFormScreen } from '../screens/main/GoalFormScreen';
import { MedicationsScreen } from '../screens/main/MedicationsScreen';
import { VaccinesScreen } from '../screens/main/VaccinesScreen';
import { VaccineFormScreen } from '../screens/main/VaccineFormScreen';
import { ParentDiaryScreen } from '../screens/main/ParentDiaryScreen';
import { WellbeingScreen } from '../screens/main/WellbeingScreen';
import { ProfessionalsScreen } from '../screens/main/ProfessionalsScreen';
import { ProfessionalFormScreen } from '../screens/main/ProfessionalFormScreen';
import { EmergencyScreen } from '../screens/main/EmergencyScreen';
import { CrisisScreen } from '../screens/main/CrisisScreen';
import { CrisisFormScreen } from '../screens/main/CrisisFormScreen';
import { GrowthScreen } from '../screens/main/GrowthScreen';
import { GrowthFormScreen } from '../screens/main/GrowthFormScreen';
import { BenefitsScreen } from '../screens/main/BenefitsScreen';
import { SleepScreen } from '../screens/main/SleepScreen';
import { SleepFormScreen } from '../screens/main/SleepFormScreen';
import { CaregiverScreen } from '../screens/main/CaregiverScreen';
import { MedicationAdherenceScreen } from '../screens/main/MedicationAdherenceScreen';
import { AboutScreen } from '../screens/main/AboutScreen';

const Stack = createStackNavigator();

const NavigationContent = () => {
  const { user, loading, dependents } = useUser();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ presentation: 'modal' }}
            />
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
              name="EventForm"
              component={EventFormScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="MedicationForm"
              component={MedicationFormScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="UploadDoc"
              component={UploadDocScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="MedicalRecord"
              component={MedicalRecordScreen}
            />
            <Stack.Screen
              name="Consultations"
              component={ConsultationsScreen}
            />
            <Stack.Screen
              name="ConsultationForm"
              component={ConsultationFormScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="Expenses" component={ExpensesScreen} />
            <Stack.Screen
              name="ExpenseForm"
              component={ExpenseFormScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="Goals" component={GoalsScreen} />
            <Stack.Screen
              name="GoalForm"
              component={GoalFormScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="Medications" component={MedicationsScreen} />
            <Stack.Screen name="Vaccines" component={VaccinesScreen} />
            <Stack.Screen
              name="VaccineForm"
              component={VaccineFormScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="ParentDiary" component={ParentDiaryScreen} />
            <Stack.Screen name="Wellbeing" component={WellbeingScreen} />
            <Stack.Screen
              name="Professionals"
              component={ProfessionalsScreen}
            />
            <Stack.Screen
              name="ProfessionalForm"
              component={ProfessionalFormScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="Emergency" component={EmergencyScreen} />
            <Stack.Screen name="Crisis" component={CrisisScreen} />
            <Stack.Screen
              name="CrisisForm"
              component={CrisisFormScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="Growth" component={GrowthScreen} />
            <Stack.Screen
              name="GrowthForm"
              component={GrowthFormScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="Benefits" component={BenefitsScreen} />
            <Stack.Screen name="Sleep" component={SleepScreen} />
            <Stack.Screen
              name="SleepForm"
              component={SleepFormScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="Caregiver" component={CaregiverScreen} />
            <Stack.Screen
              name="MedicationAdherence"
              component={MedicationAdherenceScreen}
            />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen
              name="Tutorial"
              component={TutorialScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
            />
            <Stack.Screen
              name="EditDependent"
              component={EditDependentScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export const AppNavigator = () => {
  return (
    <ThemeProvider>
      <UserProvider>
        <View style={styles.root}>
          <View style={styles.container}>
            <NavigationContent />
            <Toast />
          </View>
        </View>
      </UserProvider>
    </ThemeProvider>
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
