import re

# 1. Update AdminRoute.tsx
with open('src/components/AdminRoute.tsx', 'r') as f:
    content = f.read()

admin_route_check = """
        const { data, error } = await supabase
          .from('admins')
          .select('user_id')
          .eq('user_id', user.id)
          .single();
          
        if (data) {
          setIsAdmin(true);
"""
content = re.sub(r"const \{ data, error \} = await supabase.*?if \(data && data\.role === 'admin'\) \{.*?setIsAdmin\(true\);", admin_route_check, content, flags=re.DOTALL)

with open('src/components/AdminRoute.tsx', 'w') as f:
    f.write(content)

# 2. Update AdminLogin.tsx
with open('src/components/AdminLogin.tsx', 'r') as f:
    content = f.read()

admin_login_check_1 = """
          const { data, error } = await supabase
            .from('admins')
            .select('user_id')
            .eq('user_id', user.id)
            .single();
            
          if (data) {
"""
content = re.sub(r"const \{ data, error \} = await supabase.*?\n\s*if \(data && data\.role === 'admin'\) \{", admin_login_check_1, content, flags=re.DOTALL)

admin_login_check_2 = """
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', data.user.id)
        .single();
        
      if (adminData) {
"""
content = re.sub(r"const \{ data: profile, error: profileError \} = await supabase.*?\n\s*if \(profile && profile\.role === 'admin'\) \{", admin_login_check_2, content, flags=re.DOTALL)

with open('src/components/AdminLogin.tsx', 'w') as f:
    f.write(content)

# 3. Update LoginForm.tsx
with open('src/components/LoginForm.tsx', 'r') as f:
    content = f.read()

login_form_check = """
          const { data, error } = await supabase
            .from('admins')
            .select('user_id')
            .eq('user_id', user.id)
            .single();
            
          if (data) {
"""
content = re.sub(r"const \{ data, error \} = await supabase.*?\n\s*if \(data && data\.role === 'admin'\) \{", login_form_check, content, flags=re.DOTALL)

with open('src/components/LoginForm.tsx', 'w') as f:
    f.write(content)

