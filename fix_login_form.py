with open('src/components/LoginForm.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "navigate('/');" in line and "Instantly navigate" not in line:
        pass
    
import re
with open('src/components/LoginForm.tsx', 'r') as f:
    content = f.read()

fixed = """
  // Handle existing user
  useEffect(() => {
    async function checkRole() {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('admins')
            .select('user_id')
            .eq('user_id', user.id)
            .single();
            
          if (data) {
            navigate('/admin');
          } else {
            navigate('/');
          }
        } catch (err) {
          console.error('Error verifying user role in Supabase:', err);
          navigate('/');
        }
      }
    }
    checkRole();
  }, [user, navigate]);
"""
content = re.sub(r"  // Handle existing user\s*useEffect\(\(\) => \{.*?\s*checkRole\(\);\s*\}, \[user, navigate\]\);", fixed, content, flags=re.DOTALL)

with open('src/components/LoginForm.tsx', 'w') as f:
    f.write(content)
