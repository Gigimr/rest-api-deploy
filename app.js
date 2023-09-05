/* eslint-disable comma-dangle */
/* eslint-disable semi */
const express = require('express'); // require -> commonJS
const crypto = require('node:crypto'); // pra crear IDS
const movies = require('./movies.json');
const { validateMovie, validatePartialMovie } = require('./schemas/movies');
const cors = require('cors');
// creando API
const app = express();
// para poder crear la movie, este middleware
// ayuda a acceder al obj creato
app.use(express.json());

// métodos normales: GET/HEAD/POST
// métodos complejos: PUT/PATCH/DELETE

// CORS PRE-Flight
// OPTIONS
// si utilizamos app.use.(cors()) acepta a todos ya q tiene el cors status ('*')
app.use(
  cors({
    origin: (origin, callback) => {
      const ACCEPTED_ORIGINS = [
        'http://localhost:8080',
        'http://localhost:1234',
        'https://movies.com',
        'https://midu.dev',
      ];

      if (ACCEPTED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      if (!origin) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
  })
);
// Todos los recursos que sean MOVIES se identifica con /movies
//  Y recuperar la movie por Genero dese la query
app.get('/movies', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*'); // '*' significa todos los origenes
  const { genre } = req.query;
  if (genre) {
    const filteredMovies = movies.filter((movie) =>
      movie.genre.some((g) => g.toLowerCase() === genre.toLowerCase())
    );
    return res.json(filteredMovies);
  }
  res.json(movies);
});

// Recuperar la movie por ID
app.get('/movies/:id', (req, res) => {
  // ya tenemos el id
  const { id } = req.params;
  // recuperar la movie y de la movie.id recuperamos el id
  const movie = movies.find((movie) => movie.id === id);
  if (movie) return res.json(movie);
  res.status(404).json({ message: 'Movie not found' });
});

// Crear pelicula, siempre utilizamoe el mismo recurso osea /movies
app.post('/movies', (req, res) => {
  // Aca validamos la info
  const result = validateMovie(req.body);

  if (!result.success) {
    // 422 Unprocessable Entity
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }
  // en base de datos
  const newMovie = {
    id: crypto.randomUUID(), // crea un id
    ...result.data, // tendremos los datos q validamos, no dejara pasar datos q no estemos validando
  };

  // Esto no sería REST, porque estamos guardando
  // el estado de la aplicación en memoria
  movies.push(newMovie);
  // aca indicamos q se logro crear
  res.status(201).json(newMovie); // devolver el recurso, para actualizar la cache del client
});

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params;
  const movieIndex = movies.findIndex((movie) => movie.id === id);

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' });
  }

  movies.splice(movieIndex, 1);

  return res.json({ message: 'Movie deleted' });
});

// Patch
app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body); // valida l info

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }

  const { id } = req.params;
  const movieIndex = movies.findIndex((movie) => movie.id === id);

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' });
  }
  const updateMovie = {
    ...movies[movieIndex], // todo q esta en movieIndex
    ...result.data, // todo lo q nos ha pasado el usuario
  };
  movies[movieIndex] = updateMovie; // guardamos la peli en el indice

  return res.json(updateMovie); // devolvemos el json con la peli actualizada
});

const PORT = process.env.PORT ?? 1234;

app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`);
});
