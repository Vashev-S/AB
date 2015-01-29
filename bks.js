/**
* Object for work with users list
* @socket {objec} connection socket
* @bookData {object} adres book
*/
var LibContr = {
  socket : io.connect('http://localhost:8080'),
  addressBook : [],
  /**
  * Function wrapper for 'this.showBook()'' and 'this.getAllbok' 
  */
  onLoadPage : function() {
    if (this.addressBook){ 
      this.showBook(this.addressBook);
    };
  },
  /**
  * Delete user from storage
  * @user {object} selector of removes user
  */
  deleteBook : function(user) {
    var bookCont = $(user).closest('.list-group');
    var phoneNumber = $(user).closest('.list-group').find('.phoneNumber').text();
    var userName = $(user).closest('.list-group').find('.list-group-item-heading').text();
    //delete user from localstorage
    this.socket.emit('delItm', userName, phoneNumber);
    //delete user from GUI
    bookCont.remove();
  },
  /**
  * Edit the selected user
  * @user {object} edited user
  */
  editBook : function(user) {
    var button = $('.btstrpCstmBtn');
    var bookHrefCont = $(user).closest('.list-group a');
    var phoneNumber = $(user).closest('.list-group').find('.phoneNumber').text();
    var userName = $(user).closest('.list-group').find('.list-group-item-heading').text();
    //point new user
    $('.bookList').find('.active').removeClass('active');
    bookHrefCont.addClass('active');
    //change button
    button.removeClass('btn-success');
    button.addClass('btn-danger');
    button.text('Edit');
    //fill in the fields
    $('.userName').val(userName);
    $('.phoneNumber').val(phoneNumber);
    //scroll too input form
    $('html, body').animate({
      scrollTop: $(".userName").offset().top
    }, 1000);
  },
  /**
  * getting all elements from localstorage
  * @return {object} associative array of users
  */
  getAllBook : function() {
    this.socket.emit('getBooks'); 
  },
  /**
  * Add new name from GUI in storage and show it
  */
  addBook : function() {
    var param;
    var bookData = {};
    //get value and prepare too paste
    var phoneNumber = $('.phoneNumber').val().replace(/[^A-zА-я\d\w ]/g, '').trim();
    var userName = $('.userName').val().replace(/[^A-zА-я\d\w ]/g, '').trim();
    bookData = {'userName' : userName, 'phoneNumber' : phoneNumber};
    //check mandatory inputs
    if (!userName) {
      return this.showAlert('error', 'Check mandatory input params NAME and AUTHOR');
    };
    //delete special symbols
    for (param in bookData) {
      bookData[param] = bookData[param] === undefined ? '' : bookData[param];
    };
    //Add book and show it
    this.socket.emit('addItm', bookData);
    this.showBook([bookData]);
    //clear inputs
    this.clearField();
  },
  /**
  * Accept edits of book
  */
  acceptEditBook : function() {
    var button = $('.btstrpCstmBtn');
    var editBook = $('.bookList').find('.active');
    this.deleteBook(editBook);
    this.addBook(editBook);
    //change button
    button.removeClass('btn-danger');
    button.addClass('btn-success');
    button.text('Accept');
    //clear inputs
    this.clearField();
  },
  /**
  * Showing user in GUI
  * @bookData {object} information about user
  */
  showBook : function(bookData) {
    var html = '';
    if (!bookData) {
      return;
    };
    bookData.forEach(function(user) {
      html +=  '<div class="list-group">'+
                '<a href="#" class="list-group-item">'+
                  '<span class="glyphicon glyphicon-trash" aria-hidden="true"></span>'+
                  '<span class="glyphicon glyphicon-edit" aria-hidden="true"></span>'+
                  '<h4 class="list-group-item-heading">'+user['userName']+'</h4>'+
                  '<p class="list-group-item-text">'+
                    '<span class="phoneNumber">'+user['phoneNumber']+'</span>'+
                  '</p>'+
                '</a>'+
              '</div>';
    });
    $('.bookList').append(html);
  },
  /**
  * Check button status and choose action
  * @btn {object} clicked button
  */
  clickTheButton : function(btn) {
    var btnStatus = $(btn).text();
    switch (btnStatus) {
      case 'Accept':
        this.addBook();
      break
      case 'Edit':
        this.acceptEditBook();
      break
      default:
        this.showAlert('error', 'Unrecognized button status')
    };
  },
  /**
  * show alert message
  * @alertType {string} type of alert message
  * @alertMsg {string} alert message
  */
  showAlert : function(alertType, alertMsg) {
    $('.alert').clearQueue();
    $('.alert').removeClass().addClass('alert');
    switch (alertType) {
      case 'success' :
        $('.alert').addClass('alert-success');
      break
      case 'error' :
        $('.alert').addClass('alert-danger');
      break
      case 'info' :
        $('.alert').addClass('alert-info');
      break
      default :
        $('.alert').addClass('alert-danger');
        alertMsg = 'Unrecognized alertType'
    };
    //show alert
    $('.alert').text(alertMsg);
    $('.alert').css({'display':'block'});
    //hide alert after 6 sec
    $('.alert').delay(6000).fadeOut(300);
  },
  /**
  * Clearing inputs
  */
  clearField : function() {
    $('.userName').val('');
    $('.phoneNumber').val('');
  },
  findLike : function(value) {
    var pattern = value.replace(/[^A-zА-я\d ^\\]|\\/g, '').trim();
    if (pattern) {
      this.socket.emit('findLike', pattern);
    };
  },
  showUserLike : function(data) {
    var html = '';
    var i;
    if(data.length < 1){
      $('.dropdown-menu').css({'display':'none'});
    } else { 
      $('.dropdown-menu').css({'display':'block'});
    };
    for(i = 0; i<data.length; i+=1){
      html += '<li><a href="#">'+data[i]['userName']+'</a></li>';
    };
    $('.dropdown-menu').html(html);
  }
};

$(document).ready(function() {
  //if Browser IE
  var ua = window.navigator.userAgent;
  var msie = ua.indexOf("MSIE ");
  if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
    $('.main-cont').html('Try that pls <a href="https://www.google.ru/chrome/browser/desktop/index.html">Chrome</a>');
  };
  //START
  LibContr.getAllBook();
  //onKeyUp
  $('.userName').keyup(function(){
    var value = $(this).val();
    LibContr.findLike(value);
  });
  //Add user
  $('.btstrpCstmBtn').on('click', function() {
    LibContr.clickTheButton(this);
  });
  //Delete user
  $('.bookList').on('click', '.glyphicon-trash', function() {
    LibContr.deleteBook(this);
  });
  //Edit user
  $('.bookList').on('click', '.glyphicon-edit', function() {
    LibContr.editBook(this);
  });
  //do not hide alert
  $('.alert').on('click', function() {
    $('.alert').clearQueue();
  });
  //on click
  $('.dropdown-menu').on('click', 'li', function(){
    var userName = $(this).text();
    $('.userName').val(userName);
    $('.dropdown-menu').css({'display':'none'});
  });
  //Hide menu
  $('html').click(function() {
    if( $('.dropdown-menu').css('display') !== 'none' ){
      $('.dropdown-menu').css({'display':'none'});
    }
  });
  //socket
  LibContr.socket.on('updateData', function (data) {
    LibContr.addressBook = data;
    LibContr.onLoadPage();
  });
  //Search Like
  LibContr.socket.on('userLikeRes', function (data) {
    LibContr.showUserLike(data);
  });
  //show Alert
  LibContr.socket.on('showAlert', function (type, msg) {
    LibContr.showAlert(type, msg);
  });
});