require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

app.use(cors());
app.use(express.json());


const SECRET_KEY = process.env.JWT_SECRET;


function verifyToken(req, res, next) {
  const bearer = req.headers['authorization'];

  if (!bearer) {
    return res.status(403).json({
      error: 'Token tidak ditemukan'
    });
  }

  const token = bearer.split(' ')[1];

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        error: 'Token tidak valid'
      });
    }

    req.user = decoded;
    next();
  });
}


app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  db.query(
    'SELECT * FROM admins WHERE username = ?',
    [username],
    (err, results) => {

      if (err) {
        console.error(err);
        return res.status(500).json({
          error: 'Database error'
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          error: 'User tidak ditemukan'
        });
      }

      const user = results[0];

      bcrypt.compare(password, user.password, (err, isMatch) => {

        if (err) {
          return res.status(500).json({
            error: 'bcrypt error'
          });
        }

        if (!isMatch) {
          return res.status(401).json({
            error: 'Password salah'
          });
        }

        const token = jwt.sign(
          {
            id: user.id,
            username: user.username
          },
          SECRET_KEY,
          {
            expiresIn: '1h'
          }
        );

        res.json({
          success: true,
          token
        });
      });
    }
  );
});


app.post('/api/order', (req, res) => {

  const { items, total, notes } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({
      error: 'Keranjang kosong'
    });
  }

  db.query(
    'INSERT INTO orders (total, notes) VALUES (?, ?)',
    [total, notes],

    (err, result) => {

      if (err) {
        console.error(err);
        return res.status(500).json({
          error: 'Gagal simpan order'
        });
      }

      const orderId = result.insertId;

      items.forEach(item => {

        db.query(
          'INSERT INTO order_items (order_id, name, qty, price) VALUES (?, ?, ?, ?)',
          [
            orderId,
            item.name,
            item.qty,
            item.price
          ]
        );

      });

      res.json({
        success: true,
        orderId: 'ORD-' + orderId
      });

    }
  );
});


app.get('/api/orders', verifyToken, (req, res) => {

  const query = `
    SELECT 
      o.id,
      o.total,
      o.notes,
      o.status,
      o.created_at,
      oi.name,
      oi.qty,
      oi.price
    FROM orders o
    JOIN order_items oi
      ON o.id = oi.order_id
    ORDER BY o.id DESC
  `;

  db.query(query, (err, results) => {

    if (err) {
      console.error(err);

      return res.status(500).json({
        error: 'Gagal ambil data'
      });
    }

    const orders = {};

    results.forEach(row => {

      if (!orders[row.id]) {

        orders[row.id] = {
          id: row.id,
          total: row.total,
          notes: row.notes,
          status: row.status || 'pending',
          created_at: row.created_at,
          items: []
        };

      }

      orders[row.id].items.push({
        name: row.name,
        qty: row.qty,
        price: row.price
      });

    });

    res.json(Object.values(orders));

  });

});


app.put('/api/order/:id', verifyToken, (req, res) => {

  const { status } = req.body;

  db.query(
    'UPDATE orders SET status = ? WHERE id = ?',
    [status, req.params.id],

    (err) => {

      if (err) {
        console.error(err);

        return res.status(500).json({
          error: 'Gagal update status'
        });
      }

      res.json({
        success: true
      });

    }
  );
});


app.get('/', (req, res) => {
  res.send('Backend BanaBite jalan ');
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});