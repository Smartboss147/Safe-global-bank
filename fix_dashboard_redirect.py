import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# Add import useNavigate
content = re.sub(
    r"(import \{ useState, useEffect \} from 'react';)", 
    r"\1\nimport { useNavigate } from 'react-router-dom';", 
    content
)

# Add useNavigate and check inside Dashboard component
dashboard_start = "export default function Dashboard({ user }: { user: any }) {\n  const navigate = useNavigate();\n"
content = content.replace("export default function Dashboard({ user }: { user: any }) {\n", dashboard_start)

redirect_effect = """
  useEffect(() => {
    async function checkAdmin() {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('admins')
          .select('user_id')
          .eq('user_id', user.id)
          .single();
        if (data) {
          navigate('/admin', { replace: true });
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
      }
    }
    checkAdmin();
  }, [user, navigate]);
"""

content = re.sub(
    r"(const \[currentTime, setCurrentTime\] = useState\(new Date\(\)\);)", 
    r"\1\n" + redirect_effect, 
    content
)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)
