import axios from 'axios';

async function run() {
  try {
    // 1. register user
    const username = `testuser${Date.now()}@example.com`;
    const regRes = await axios.post('http://localhost:8080/api/auth/register', {
      email: username,
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    });
    const token = regRes.data.token || regRes.data.accessToken || regRes.data;
    
    // 2. create category
    const catRes = await axios.post('http://localhost:8080/api/categories', {
      name: 'Food',
      type: 'EXPENSE',
      color: '#ff0000',
      icon: 'food'
    }, { headers: { Authorization: `Bearer ${token}` } });
    const categoryId = catRes.data.id;
    
    // 3. create budget
    try {
      const budgetRes = await axios.post('http://localhost:8080/api/budgets', {
        categoryId: categoryId,
        limitAmount: 1000,
        month: 3,
        year: 2026
      }, { headers: { Authorization: `Bearer ${token}` } });
      console.log('Budget created successfully!', budgetRes.data);
    } catch (e) {
      console.error('Budget creation failed!');
      console.error('Status:', e.response?.status);
      console.error('Data:', e.response?.data);
    }
  } catch(e) {
    console.error('Test user setup failed', e.response?.data || e.message);
  }
}
run();
