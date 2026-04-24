/**
 * Global Navigation Types (Akita Mode)
 * Defines the strict params expected by each screen in the Root Stack.
 */
import { NavigatorScreenParams, CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Event, Medication, Consultation, Expense, Goal, Vaccine, Professional, CrisisEvent, SleepLog, Dependent, GrowthMeasurement } from '../lib/schemas';

export type MainTabParamList = {
  DashboardTab: undefined;
  AgendaTab: undefined;
  EvolutionTab: undefined;
  VaultTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  ForgotPassword: { email?: string } | undefined;
  Tutorial: { fromProfile?: boolean } | undefined;
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  EventForm: { eventId?: string; date?: string; event?: Event } | undefined;
  MedicationForm: { medicationId?: string; medication?: Medication } | undefined;
  UploadDoc: { folderId?: string } | undefined;
  MedicalRecord: undefined;
  Consultations: undefined;
  ConsultationForm: { consultationId?: string; consultation?: Consultation } | undefined;
  Expenses: undefined;
  ExpenseForm: { expenseId?: string; expense?: Expense } | undefined;
  Goals: undefined;
  GoalForm: { goalId?: string; goal?: Goal } | undefined;
  Medications: undefined;
  Vaccines: undefined;
  VaccineForm: { vaccineId?: string; vaccine?: Vaccine } | undefined;
  ParentDiary: undefined;
  Wellbeing: undefined;
  Professionals: undefined;
  ProfessionalForm: { professionalId?: string; professional?: Professional } | undefined;
  Emergency: undefined;
  Crisis: undefined;
  CrisisForm: { crisisId?: string; crisis?: CrisisEvent } | undefined;
  Growth: undefined;
  GrowthForm: { measurementId?: string; measurement?: GrowthMeasurement } | undefined;
  Benefits: undefined;
  Sleep: undefined;
  SleepForm: { sleepId?: string; date?: string; sleep?: SleepLog } | undefined;
  Caregiver: undefined;
  MedicationAdherence: { medicationId: string };
  About: undefined;
  Notifications: undefined;
  EditDependent: { dependentId?: string; dependent: Dependent };
  AddDependent: undefined;
};

export type RootStackProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export type MainTabProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
