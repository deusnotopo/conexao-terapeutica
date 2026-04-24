const fs = require('fs');
const files = [
  'D:/projetos/conexao-terapeutica/src/screens/auth/ForgotPasswordScreen.tsx',
  'D:/projetos/conexao-terapeutica/src/screens/main/BenefitsScreen.tsx',
  'D:/projetos/conexao-terapeutica/src/screens/main/CaregiverScreen.tsx',
  'D:/projetos/conexao-terapeutica/src/screens/main/GoalsScreen.tsx',
  'D:/projetos/conexao-terapeutica/src/screens/main/ParentDiaryScreen.tsx',
  'D:/projetos/conexao-terapeutica/src/screens/main/UploadDocScreen.tsx',
  'D:/projetos/conexao-terapeutica/src/screens/main/VaultScreen.tsx',
  'D:/projetos/conexao-terapeutica/src/screens/main/WellbeingScreen.tsx'
];

files.forEach(f => {
  let code = fs.readFileSync(f, 'utf8');
  if (code.includes('<ScrollView') && !code.includes('keyboardShouldPersistTaps')) {
    code = code.replace(/<ScrollView/g, '<ScrollView keyboardShouldPersistTaps="handled"');
    fs.writeFileSync(f, code, 'utf8');
    console.log('Patched: ' + f);
  }
});
