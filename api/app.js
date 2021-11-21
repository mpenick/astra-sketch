var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var grpc = require('./grpc')
var config = require('./config')

const keyspace = config.KEYSPACE;

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var newGameRouter = require('./routes/newGame');
var streamRouter = require('./routes/stream');
const { Query } = require('@stargate-oss/stargate-grpc-node-client');

async function createSchema() {
  await grpc.client.executeQuery(new Query().setCql(
    `CREATE TABLE IF NOT EXISTS ${keyspace}.game 
      (game_id text, 
       vip text, 
       players list<text>, 
       state text, 
       topic text, 
       PRIMARY KEY(game_id))`));
  await grpc.client.executeQuery(new Query().setCql(
    `CREATE TABLE IF NOT EXISTS ${keyspace}.topics 
      (game_id text, 
       topic text,
       player text,
       svg text, 
       PRIMARY KEY(game_id, topic, player))`));
  await grpc.client.executeQuery(new Query().setCql(
    `CREATE TABLE IF NOT EXISTS ${keyspace}.guesses 
      (game_id text, 
       topic text,
       player text,
       guess text,
       votes list<text>,
       PRIMARY KEY(game_id, topic, player))`));
}

createSchema();

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use("/newGame/", newGameRouter);
app.use("/stream/", streamRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
