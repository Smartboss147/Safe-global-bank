import re

with open('src/components/LoginForm.tsx', 'r') as f:
    content = f.read()

fixed_redirect = """
  // Redirect if already logged in
  useEffect(() => {
    async function checkExistingUser() {
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
    checkExistingUser();
  }, [user, navigate]);
"""
content = re.sub(r"\s*// Redirect if already logged in\s*useEffect\(\(\) => \{.*?\}\s*checkExistingUser\(\);\s*\}, \[user, navigate\]\);", fixed_redirect, content, flags=re.DOTALL)

with open('src/components/LoginForm.tsx', 'w') as f:
    f.write(content)
