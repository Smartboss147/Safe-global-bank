import re

with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace("import { createClient } from '@supabase/supabase-js';", "")
content = "import { createClient } from '@supabase/supabase-js';\n" + content

with open('server.ts', 'w') as f:
    f.write(content)
