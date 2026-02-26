const functions = require('@google-cloud/functions-framework');
const { Storage } = require('@google-cloud/storage');
const { v4: uuidv4 } = require('uuid');

const storage = new Storage();
const BUCKET_NAME = process.env.BUCKET_NAME;

functions.http('api', async (req, res) => {
  // CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (!BUCKET_NAME) {
    res.status(500).json({ error: 'BUCKET_NAME not configured' });
    return;
  }

  const path = req.path;

  try {
    // POST /save - Save a drawing
    if (req.method === 'POST' && path === '/save') {
      const { image, id: clientId } = req.body;
      if (!image) {
        res.status(400).json({ error: 'image is required' });
        return;
      }

      const id = clientId || uuidv4();
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const bucket = storage.bucket(BUCKET_NAME);
      const file = bucket.file(`drawings/${id}.png`);

      await file.save(buffer, {
        contentType: 'image/png',
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      });

      const url = `https://storage.googleapis.com/${BUCKET_NAME}/drawings/${id}.png`;
      res.json({ id, url, createdAt: new Date().toISOString() });
    }

    // GET /gallery - Latest 30 drawings
    else if (req.method === 'GET' && path === '/gallery') {
      const bucket = storage.bucket(BUCKET_NAME);
      const [files] = await bucket.getFiles({ prefix: 'drawings/' });

      const drawings = files
        .filter((f) => f.name.endsWith('.png'))
        .map((f) => ({
          id: f.name.replace('drawings/', '').replace('.png', ''),
          url: `https://storage.googleapis.com/${BUCKET_NAME}/${f.name}`,
          createdAt: f.metadata.timeCreated,
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 30);

      res.json({ drawings });
    }

    // GET /drawings?ids=id1,id2,... - Get specific drawings
    else if (req.method === 'GET' && path === '/drawings') {
      const ids = (req.query.ids || '').split(',').filter(Boolean);

      if (ids.length === 0) {
        res.json({ drawings: [] });
        return;
      }

      const bucket = storage.bucket(BUCKET_NAME);
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const file = bucket.file(`drawings/${id}.png`);
            const [exists] = await file.exists();
            if (!exists) return null;
            const [metadata] = await file.getMetadata();
            return {
              id,
              url: `https://storage.googleapis.com/${BUCKET_NAME}/drawings/${id}.png`,
              createdAt: metadata.timeCreated,
            };
          } catch {
            return null;
          }
        })
      );

      res.json({ drawings: results.filter(Boolean) });
    }

    // DELETE /drawings/:id - Delete a drawing
    else if (req.method === 'DELETE' && path.startsWith('/drawings/')) {
      const id = path.replace('/drawings/', '');
      if (!id) {
        res.status(400).json({ error: 'id is required' });
        return;
      }

      const bucket = storage.bucket(BUCKET_NAME);
      const file = bucket.file(`drawings/${id}.png`);
      const [exists] = await file.exists();

      if (!exists) {
        res.status(404).json({ error: 'Drawing not found' });
        return;
      }

      await file.delete();
      res.json({ success: true });
    }

    // 404
    else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
