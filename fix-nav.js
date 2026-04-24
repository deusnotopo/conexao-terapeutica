const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src/screens');

const rootMap = {
  LoginScreen: 'Login',
  ForgotPasswordScreen: 'ForgotPassword',
  TutorialScreen: 'Tutorial',
  OnboardingScreen: 'Onboarding',
  EventFormScreen: 'EventForm',
  MedicationFormScreen: 'MedicationForm',
  UploadDocScreen: 'UploadDoc',
  MedicalRecordScreen: 'MedicalRecord',
  ConsultationsScreen: 'Consultations',
  ConsultationFormScreen: 'ConsultationForm',
  ExpensesScreen: 'Expenses',
  ExpenseFormScreen: 'ExpenseForm',
  GoalsScreen: 'Goals',
  GoalFormScreen: 'GoalForm',
  MedicationsScreen: 'Medications',
  VaccinesScreen: 'Vaccines',
  VaccineFormScreen: 'VaccineForm',
  ParentDiaryScreen: 'ParentDiary',
  WellbeingScreen: 'Wellbeing',
  ProfessionalsScreen: 'Professionals',
  ProfessionalFormScreen: 'ProfessionalForm',
  EmergencyScreen: 'Emergency',
  CrisisScreen: 'Crisis',
  CrisisFormScreen: 'CrisisForm',
  GrowthScreen: 'Growth',
  GrowthFormScreen: 'GrowthForm',
  BenefitsScreen: 'Benefits',
  SleepScreen: 'Sleep',
  SleepFormScreen: 'SleepForm',
  CaregiverScreen: 'Caregiver',
  MedicationAdherenceScreen: 'MedicationAdherence',
  AboutScreen: 'About',
  NotificationsScreen: 'Notifications',
  EditDependentScreen: 'EditDependent',
  SplashScreen: 'SplashScreen',
  EvolutionScreen: 'MainTabs'
};

const tabMap = {
  DashboardScreen: 'DashboardTab',
  AgendaScreen: 'AgendaTab',
  EvolutionScreen: 'EvolutionTab',
  VaultScreen: 'VaultTab',
  ProfileScreen: 'ProfileTab',
};

function getDepth(fullPath) {
    const relative = path.relative(path.join(__dirname, 'src'), fullPath);
    const depth = relative.split(path.sep).length - 1;
    return '../'.repeat(depth);
}

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const originalContent = content;
            
            const screenNameMatch = file.replace(/\.tsx?$/, '');
            const isTab = !!tabMap[screenNameMatch];
            const isRoot = !!rootMap[screenNameMatch];
            const hasAnyNav = content.includes(': any');

            if (hasAnyNav && (isTab || isRoot)) {
                let typeStr = isTab ? `MainTabProps<'${tabMap[screenNameMatch]}'>` : `RootStackProps<'${rootMap[screenNameMatch]}'>`;
                const depthStr = getDepth(fullPath).replace(/\\/g, '/');
                let importStr = `import { ${isTab ? 'MainTabProps' : 'RootStackProps'} } from '${depthStr}navigation/types';\n`;

                content = content.replace(/export const (\w+) = \(\{([\w\s,]+)\}\s*:\s*any\)\s*=>/g, (match, name, props) => {
                    return `export const ${name} = ({${props}}: ${typeStr}) =>`;
                });

                if (content !== originalContent) {
                    if (!content.includes('navigation/types')) {
                        content = content.replace(/import React(.*?)from 'react';/, `import React$1from 'react';\n${importStr}`);
                    }
                    fs.writeFileSync(fullPath, content);
                    console.log(`Successfully updated ${file}`);
                } else {
                    console.log(`Failed regex for ${file} even though it has : any`);
                }
            }
        }
    }
}

processDir(screensDir);
