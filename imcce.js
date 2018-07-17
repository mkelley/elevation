/**********************************************************************/
class IMCCE {
  constructor() {
    Util.msg("Using IMCCE's ephemeris service.");
  }

  checkAvailability() {
    var params = {
      '-mime': 'votable',
      '-from': 'elevation-webapp'
    };
    $.get('http://vo.imcce.fr/webservices/miriade/getAvailability_query.php',
          params)
      .done(
	function(data){
 	  var doc = $(data);
 	  var test = eph.getDataByField(doc, 'Availability');
 	  if (test != 'Available') {
 	    Util.msg("IMCCE's Miriade service is unavailable.", true);
 	  } else {
	    Util.msg("IMCCE's Miriade service is available.");
	  }
	});
  }

  get(name, type, done, opts) {
    /* name : string
         The name of the object, resolvable by Miriade.
       type : string
         'a', 'c', or 'p' for asteroid, comet, or "planet".
       done : function
         Pass the target onto this function.
       opts : object
         Additional parameters passed to the done function.
    */
    var date = observatory.date;
    if (isNaN(date)) {
      Util.msg(Date() + ': Invalid date.', true);
      return;
    }
    
    var params = {};
    params['-name'] = type + ':' + name;
    params['-ep'] = date.toISOString();
    params['-mime'] = 'votable';
    params['-tcoor'] = '5';
    params['-from'] = 'elevation-webapp';
    var self = this;
    $.get('http://vo.imcce.fr/webservices/miriade/ephemcc_query.php', params)
      .done(function(data){self.processVotable(data, done, name, type, opts);});
  }

  getDataByField(doc, fieldName) {
    var fields = doc.find('vot\\:FIELD, FIELD');
    var columns = doc.find('vot\\:TD, TD');
    var field = doc.find('vot\\:FIELD[name="' + fieldName + '"], '
			 + 'FIELD[name="' + fieldName + '"]')[0];
    var i = fields.index(field);
    return columns[i].textContent;
  }

  processVotable(data, done, name, type, opts) {
    var doc = $(data);

    var status = doc.find('vot\\:INFO[name="QUERY_STATUS"], '
			  + 'INFO[name="QUERY_STATUS"]');
    if (status.attr('value') == 'ERROR') {
      Util.msg(status.text(), true);
      return;
    }

    var name = name;
    var ra = new Angle(this.getDataByField(doc, 'RAJ2000'), 'hr');
    var dec = new Angle(this.getDataByField(doc, 'DECJ2000'), 'deg');

    var attr = {};
    attr.rh = parseFloat(this.getDataByField(doc, 'Heliocentric distance'));
    attr.delta = parseFloat(this.getDataByField(doc, 'Distance to observer'));
    attr.mv = parseFloat(this.getDataByField(doc, 'Mv'));
    if (type == "c") {
      attr.FoM = Util.figureOfMerit(attr.rh, attr.delta, attr.mv);
    }
    attr.phase = parseFloat(this.getDataByField(doc, 'Phase'));
    attr.elong = parseFloat(this.getDataByField(doc, 'Elongation'));
    var dra = parseFloat(this.getDataByField(doc, 'dRAcosDEC'));
    var ddec = parseFloat(this.getDataByField(doc, 'dDEC'));
    attr.mu = 60 * Math.sqrt(Math.pow(dra, 2) + Math.pow(ddec, 2));
    attr.ddot = parseFloat(this.getDataByField(doc, 'dist_dot'));
    
    done(new Target(name, ra, dec, type, attr), opts);
  }
}
