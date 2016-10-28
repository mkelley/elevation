function loadTargetSetButton(e) {
  var button = $(e.target);  
  $('#elevation-target-list').html(button.data('targets'));
  console.log(button);
  console.log(button.data('targets'));
}
