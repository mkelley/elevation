import { useQuery } from "react-query";
import Angle from "../model/Angle";

const MPC_URL = 'https://cgi.minorplanetcenter.net/cgi-bin/mpeph2.cgi';

const MOCK_RESPONSE = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=ISO-8859-1">
<title>Minor Planet Ephemeris Service: Query Results</title>
</head>
<body>
<h1>Minor Planet Ephemeris Service: Query Results</h1>
Below are the results of your request from the Minor Planet Center's
Minor Planet Ephemeris Service.
Ephemerides are for
the long., lat. and alt. you specified.
<p><hr><p>
<b>   2P/Encke</b>
<p>Perturbed ephemeris below is based on
unperturbed elements from 
<a href="https://www.minorplanetcenter.net/mpec/K22/K22K19.html"><i>MPEC</i> 2022-K19</a>.
<p>
<p><pre>
0002P
Date       UT      R.A. (J2000) Decl.    Delta     r     El.    Ph.   m1     Sky Motion        Object    Sun   Moon
           h m s                                                            "/hr     P.A.    Azi. Alt.  Alt.  Phase Dist. Alt.
2022 06 02 070000 23 54 43.0 +01 48 30   4.229   4.031   72.0  13.8  23.5   18.06    058.1    229  +46   +53   0.07   102  +28
</pre>
<p><hr><p>
These calculations have been performed on the
<a href="http://www.minorplanetcenter.net/iau/Ack/TamkinFoundation.html">Tamkin
Foundation Computing Network</a>.
<p><hr>
<p>
      <a href="http://validator.w3.org/check?uri=referer"><img border="0"
          src="http://www.w3.org/Icons/valid-html401"
          alt="Valid HTML 4.01!" height="31" width="88"></a>
</p>
</body>
</html>`;

export default function useMpcEphemerisService(target, observer, onSuccess, mockResponse) {
  const date = observer && observer.date
    .toISOString()
    .replace('T', ' ')
    .substring(0, 13);

  const latitude = observer && observer.latitude;
  const longitude = observer && observer.latitude;
  const altitude = observer && observer.altitude;

  return useQuery(
    ['mpes', target.moving, target.name, date, longitude, latitude, altitude, mockResponse],
    () => fetchMpcEphemerisService(target.moving, target.name, date, longitude, latitude, altitude, mockResponse)
      .then(parseMpcEphemerisServiceResponse),
    {
      retry: false,
      staleTime: Infinity,
      onSuccess: onSuccess,
      refetchOnMount: "always"
    }
  );
}

async function fetchMpcEphemerisService(moving, name, date, longitude, latitude, altitude, mockResponse) {
  // if this is not a moving target, quietly return
  if (!moving)
    return new Promise(resolve => resolve(null));

  if (!(name && date && longitude && latitude && altitude))
    throw new Error('not all required properties are defined');

  if (mockResponse) {
    console.log('Fetching mock MPES response.');
    return new Promise(resolve => resolve(MOCK_RESPONSE));
  }

  console.log(`Fetching ephemeris for ${name} from (${longitude.deg} deg, ${latitude.deg} deg, ${altitude} m) at ${date}`);

  // Get the ephemeris
  const parameters = new URLSearchParams({
    ty: 'e',           // ephemeris
    TextArea: name,    // target name
    uto: '0',          // UT offset for daily ephemerides
    igd: 'n',          // suppress daytime
    ibh: 'n',          // suppress set
    fp: 'y',           // use perturbed elements
    adir: 'N',         // azimuth is east of north
    tit: '',           // no page title
    bu: '',            // no base url
    'long': longitude.deg, // longitude, decimal degrees
    lat: latitude.deg,     // latitude, decimal degrees
    alt: altitude,         // altitude, meters
    d: date,           // date
    l: 1,              // number of dates to output
    i: '1',            // interval size
    u: 'd',            // interval unit
    raty: 'a',         // ephemeris type: equatorial, max precision
    s: 't',            // proper motion: total motion and PA
    m: 'h'             // proper motion: arcsec/hr
  });

  const response = await fetch(MPC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // 'mode': 'cors',
      // 'Access-Control-Allow-Origin': 'localhost',
      // 'Access-Control-Allow-Headers': 'body',
    },
    body: parameters.toString()
  });

  if (!response.ok) {
    throw new Error(`Error fetching ephemeris for ${name} from (${longitude.deg} deg, ${latitude.deg} deg, ${altitude} m) at ${date}`);
  }

  return response.text();
}

function parseMpcEphemerisServiceResponse(text) {
  // nothing to parse
  if (!text)
    return null;

  // Parse the response
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/html");

  if (doc.getElementsByTagName('title')[0].innerText === 'Incorrect Form Entry') {
    throw new Error(text);
  }

  const table = doc.getElementsByTagName('pre')[0].innerText;
  const lines = table.split('\n');
  const eph = lines[lines.length - 2];

  const ephemeris = {
    mpcName: lines[0].replace(/^0+/, ''),
    ra: new Angle(eph.substring(18, 28), 'hr'),
    dec: new Angle(eph.substring(29, 38), 'deg'),
    properMotion: parseFloat(eph.substring(74, 81)),
    rh: parseFloat(eph.substring(47, 54)),
    delta: parseFloat(eph.substring(39, 46)),
    phase: parseFloat(eph.substring(62, 67)),
    mV: parseFloat(eph.substring(69, 73)),
    solarElongation: parseFloat(eph.substring(56, 61)),
    lunarElongation: parseFloat(eph.substring(118, 121)),
  }

  return ephemeris;
}