const pool = require('../database'); // PostgreSQL connection

router.get('/:id/public-key', async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await pool.query(
      'SELECT public_key FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ publicKey: result.rows[0].public_key });
  } catch (error) {
    console.error('Error fetching public key:', error.stack);
    res.status(500).json({ error: 'Failed to fetch public key' });
  }
});

module.exports = router;
