const { query } = require('../config/db');

const ecopointModel = {
  async getAllEcoPoints(city = 'Pamplona') {
    const result = await query(
      `SELECT id, name, address, city, lat, lng 
       FROM ecopoints 
       WHERE city = $1`,
      [city]
    );
    return result.rows;
  },

  async getNearbyEcoPoints(lat, lng, radiusMeters = 5000, city = 'Pamplona') {
    try {
      const result = await query(
        `SELECT id, name, address, city, lat, lng,
                ST_DistanceSphere(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as distance_meters
         FROM ecopoints
         WHERE city = $3
         AND ST_DistanceSphere(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)) <= $4
         ORDER BY distance_meters ASC`,
        [lng, lat, city, radiusMeters]
      );
      return result.rows;
    } catch (err) {
      const result = await query(
        `SELECT id, name, address, city, lat, lng,
                (6371000 * acos(
                  LEAST(1.0, GREATEST(-1.0,
                    cos(radians($2)) * cos(radians(lat)) * cos(radians(lng) - radians($1)) +
                    sin(radians($2)) * sin(radians(lat))
                  ))
                )) as distance_meters
         FROM ecopoints
         WHERE city = $3
         AND (6371000 * acos(
               LEAST(1.0, GREATEST(-1.0,
                 cos(radians($2)) * cos(radians(lat)) * cos(radians(lng) - radians($1)) +
                 sin(radians($2)) * sin(radians(lat))
               ))
             )) <= $4
         ORDER BY distance_meters ASC`,
        [lng, lat, city, radiusMeters]
      );
      return result.rows;
    }
  }
};

module.exports = ecopointModel;
