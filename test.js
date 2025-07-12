const bcrypt = require('bcryptjs');
(async () => {
  const password = 'testpass';
  const hash = await bcrypt.hash(password, 10);
  const ok = await bcrypt.compare(password, hash);
  if (!ok) {
    throw new Error('bcrypt failed');
  }
})();
