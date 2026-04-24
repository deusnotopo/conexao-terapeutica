import os
import re

dir_path = r'c:\Users\GN\.gemini\antigravity\scratch\conexao-terapeutica\src\screens\main'

for root, dirs, files in os.walk(dir_path):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8') as f_obj:
                content = f_obj.read()
            
            # Replace catch(e: any) with catch(e: unknown)
            new_content = re.sub(r'catch\s*\(\s*([a-zA-Z0-9_]+)\s*:\s*any\s*\)', r'catch (\1: unknown)', content)
            
            # Replace parameters
            new_content = re.sub(r'= \(\{ navigation, route \}: any\) => \{', r"= ({ navigation, route }: RootStackProps<any>) => {", new_content)
            
            if content != new_content:
                if 'RootStackProps' not in new_content:
                    new_content = "import { RootStackProps } from '../../navigation/types';\n" + new_content
                     
                with open(filepath, 'w', encoding='utf-8') as f_obj:
                    f_obj.write(new_content)
                print(f'Updated {f}')
