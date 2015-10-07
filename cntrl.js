var Control = {
  express: require('express'),
  http: require('http'),
  fs: require('fs'),
  mongoose: require('mongoose'),
  io: {},
  serverRun: function() {
    var collection, socketGroup;
    this.serverListen();
    socketGroup = this.mongoConnect();
    return socketGroup();
  },
  serverListen: function() {
    var app = this.express();
    var server = this.http.createServer(app);
    this.io = require('socket.io').listen(server);
    this.routingCntrl(app);
    return server.listen(8080);
  },
  mongoConnect: function() {
    var that = this;
    var User;
    var DB = this.mongoose.connection;
    var mongoDriver = this.mongoose;
    DB.on('error', console.error);
    mongoDriver.connect('mongodb://localhost/test');
    return function() {
      return DB.once('open', function() {
              var userSchema = new mongoDriver.Schema({
                userName: String,
                phoneNumber: String
              });
              User = mongoDriver.model('User', userSchema);
              that.socketGroup.call(that, User);
            });
    };
  },
  //REQUIER!!!!
  routingCntrl: function(app) {
    app.get('/', function(req, res) {
      res.sendFile(__dirname + '/bks.html');
    });
    app.get('/bks.js', function(req, res) {
      res.sendFile(__dirname + '/bks.js');
    });
    app.get('/bks.css', function(req, res) {
      res.sendFile(__dirname + '/bks.css');
    });
  },
  socketGroup: function(User) {
    this.io.sockets.on('connection', function(socket) {
      if (User === undefined) {
        socket.emit('showAlert', 'error', 'DataBase connection problem');
        return 'DataBase connection problem';
      }
      //get users
      socket.on('getBooks', function() {
        User.find(function(err, user) {
          if (err) return console.error(err);
          socket.emit('updateData', user);
        });
      });
      //add user
      socket.on('addItm', function(data) {
        if (!data) {
          return 'add item data undefined';
        }
          var user = new User({
               userName: data['userName']
              ,phoneNumber: data['phoneNumber']
          });

          user.save(function(err, thor) {
            if (err) return console.error(err);
            socket.emit('showAlert', 'success', 'The user has been added');
          });
      });
      //delete user
      socket.on('delItm', function(userName, phoneNumber) {
        if (!userName) {
          socket.emit('showAlert', 'warning', 'Empty set');
          return 'delete item data undefined';
        }
        phoneNumber = phoneNumber === undefined ? '' : phoneNumber;
        User
          .where({'userName': userName, 'phoneNumber': phoneNumber})
          .findOneAndRemove(
            function(err, user) {
              if (err) return console.error(err);
                socket.emit(
                  'showAlert',
                  'success',
                  'The user has been deleted'
                );
            }
          );
      });
      //WHERE userName LIKE @pattern
      socket.on('findLike', function(pattern) {
        pattern = pattern.replace(/[^A-zА-я\d ^\\]|\\/g, '').trim();
        var query = { userName: new RegExp('^' + pattern, 'i') };
        if (!pattern) {
          return 'pattern search undefined';
        }
        User.find(query, function(err, user) {
          if (err) return console.error(err);
          socket.emit('userLikeRes', user);
        });
      });
    });
  }
};
Control.serverRun();
