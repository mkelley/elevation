import React from 'react';
import { animateScroll as scroll } from 'react-scroll/modules';
import Angle from '../model/Angle';

function textToTargets(text) {
  const targets = text.split("\n")
    .map((row) => row.trim())
    .filter((row) => row[0] !== "#")
    .filter((row) => row !== "")
    .map((row) => {
      const cols = row.split(',').map((col) => col.trim());
      return {
        name: cols[0],
        moving: cols[1] === 'm',
        ra: (!cols[2] || cols[2] === "") ? "" : new Angle(cols[2], 'hr'),
        dec: (!cols[3] || cols[3] === "") ? "" : new Angle(cols[3], 'deg'),
        mV: cols[4] || "",
        notes: cols[5] || "",
        selected: false,
        plot: false,
        refresh: true,
      }
    })
  return targets;
}

const lookTargets = `
# Target, Type, RA, Dec, mV, Notes
2005 QN173,m,,,,LOOK
2060,m,,,,LOOK
7P,m,,,,LOOK
29P,m,,,,LOOK
57P,m,,,,LOOK
67P,m,,,,LOOK
97P,m,,,,LOOK
108P,m,,,,LOOK
141P,m,,,,LOOK
156P,m,,,,LOOK
191P,m,,,,LOOK
382P,m,,,,LOOK
C/2014 UN271,m,,,,LOOK
C/2017 K2,m,,,,LOOK
C/2018 F4-A,m,,,,LOOK
C/2019 F1,m,,,,LOOK
C/2019 L3,m,,,,LOOK
C/2019 U5,m,,,,LOOK
C/2020 O2,m,,,,LOOK
C/2020 R4,m,,,,LOOK
C/2020 R7,m,,,,LOOK
C/2020 T2,m,,,,LOOK
C/2020 U4,m,,,,LOOK
C/2021 A1,m,,,,LOOK
C/2021 C4,m,,,,LOOK
C/2021 C5,m,,,,LOOK
C/2021 E3,m,,,,LOOK
C/2021 G2,m,,,,LOOK
C/2021 K2,m,,,,LOOK
C/2021 K3,m,,,,LOOK
C/2021 O3,m,,,,LOOK
C/2021 P4,m,,,,LOOK
C/2021 Q4,m,,,,LOOK
C/2021 R2,m,,,,LOOK
C/2021 S3,m,,,,LOOK
C/2021 T4,m,,,,LOOK
C/2021 Y1,m,,,,LOOK
C/2022 A2,m,,,,LOOK
C/2022 A3,m,,,,LOOK
C/2022 E2,m,,,,LOOK
C/2022 E3,m,,,,LOOK
C/2022 F1,m,,,,LOOK
`.trim();

const ldtTargets = `
# Target, Type, RA, Dec, mV, Notes
12P,m,,,,2022B
73P,m,,,,2022B
81P,m,,,,2022B
169P,m,,,,2022B
238P,m,,,,2022B
C/2017 K2,m,,,,2022B
C/2019 O3,m,,,,2022B
C/2020 K1,m,,,,2022B
C/2020 U5,m,,,,2022B
C/2021 T4,m,,,,2022B
C/2022 A2,m,,,,2022B
C/2022 E3,m,,,,2022B
`.trim();

const cometaryOrbitalTrends = `
# Target, Type, RA, Dec, mV, Notes
2P,m,,,,Orbital Trends
6P,m,,,,Orbital Trends
9P,m,,,,Orbital Trends
10P,m,,,,Orbital Trends
15P,m,,,,Orbital Trends
19P,m,,,,Orbital Trends
22P,m,,,,Orbital Trends
46P,m,,,,Orbital Trends
67P,m,,,,Orbital Trends
71P,m,,,,Orbital Trends
73P,m,,,,Orbital Trends
81P,m,,,,Orbital Trends
88P,m,,,,Orbital Trends
103P,m,,,,Orbital Trends
C/2012 K1,m,,,,Orbital Trends
C/2013 A1,m,,,,Orbital Trends
C/2013 US10,m,,,,Orbital Trends
C/2013 X1,m,,,,Orbital Trends
C/2014 Q2,m,,,,Orbital Trends
C/2014 Q3,m,,,,Orbital Trends
C/2015 V2,m,,,,Orbital Trends
C/2015 VL62,m,,,,Orbital Trends
C/2016 M1,m,,,,Orbital Trends
C/2017 K2,m,,,,Orbital Trends
`.trim();

const jwstCycle1 = `
# Target, Type, RA, Dec, mV, Notes
9P,m,,,,Organics
22P,m,,,,GTO
238P,m,,,,GTO
29P,m,,,,Centaurs
39P,m,,,,Centaurs
423P,m,,,,Centaurs (nee P/2008 CL94)
C/2014 OG392,m,,,,Centaurs
P/2019 LD2,m,,,,Centaurs
C/2004 A1,m,,,,Centaurs
C/2017 K2,m,,,,Organics
`.trim();

const jwstCycle2 = `
# Target, Type, RA, Dec, mV, Notes
C/2019 E3,m,,,,Ice 2876
C/2019 O3,m,,,,Ice 2876
C/2020 F2,m,,,,Ice 2876
133P,m,,,,MBCs 4250
358P,m,,,,MBCs 4250
`.trim();

const hbStandards = `
# HB filter B-type flux standards, Farnham et al. 2000
# Target, Type, RA, Dec, mV, Notes
  3379, f, 00:36:47.24, +15:13:54.5, 5.89, variable (Δm<0.05)
  6815, f, 01:08:55.72, +09:43:49.4, 7.30,
 14951, f, 02:24:48.92, +10:36:38.9, 5.46,
 19712, f, 03:10:18.03, -01:41:40.7, 7.35,
 26912, f, 04:15:31.93, +08:53:33.5, 4.27,
 31331, f, 04:54:50.63, +00:28:02.6, 5.99,
 37112, f, 05:36:03.50, -00:46:48.6, 8.02, nearby bright star: 1.7 mag | 142'' E / 1518'' S
 52266, f, 07:00:21.05, -05:49:36.7, 7.23,
 68099, f, 08:11:16.56, +09:49:16.9, 6.07,
 72526, f, 08:33:25.29, -00:18:29.1, 7.93,
 74280, f, 08:43:13.48, +03:23:55.2, 4.30, variable (Δm<0.05)
 89688, f, 10:21:01.97, +02:17:23.1, 6.68, variable (Δm<0.05) | nearby star: 8.9 mag | 200'' W / 220'' N
 97991, f, 11:16:11.55, -03:28:19.6, 7.41, nearby bright star: 4.6 mag | 420'' E / 645'' S
120086, f, 13:47:19.13, -02:26:36.8, 7.90, variable (Δm<0.05)
129956, f, 14:45:30.26, +00:43:02.8, 5.70,
149363, f, 16:34:28.22, -06:08:09.4, 7.80,
154445, f, 17:05:32.14, -00:53:31.6, 5.64,
164852, f, 18:02:22.98, +20:50:01.3, 5.27,
170783, f, 18:31:04.35, +04:37:37.4, 7.73,
187350, f, 19:49:33.40, -01:06:03.1, 8.14, emission line star
191263, f, 20:08:38.16, +10:43:32.5, 6.33,
205130, f, 21:33:35.23, -09:39:38.1, 7.88, nearby star: 9.2 mag | 325'' W / 156.5'' N
209008, f, 22:00:07.78, +06:43:02.1, 6.00,
219188, f, 23:14:00.48, +04:59:49.6, 7.05,
`.trim();

const delsantiAnalogs = `
# Collected solar analogs by Audrey Delsanti

# Binzel and Bus, used at IRTF and Palomar
SA 93-101,   f, 01:53:18.0, +00:22:25,  9.7
Hyades 64,   f, 04:26:40.1, +16:44:49,  8.1, used by VLT LP; HD 28099
SA 98-978,   f, 06:51:34.0, -00:11:33, 10.5
SA 102-1081, f, 10:57:04.4, -00:13:12,  9.9
BS 4486,     f, 11:38:44.8, +45:06:31,  6.4
SA 107-684,  f, 15:37:18.1, -00:09:50,  8.4
SA 107-998,  f, 15:38:16.4, +00:15:23, 10.4
SA 110-361,  f, 18:42:45.0, +00:08:04, 12.4
16 Cyg B,    f, 19:41:52.0, +50:31:03,  6.2, HD 186427           
SA 112-1333, f, 20:43:11.8, +00:26:15, 10.0
SA 115-271,  f, 23:42:41.8, +00:45:14,  9.7


# From Hardop, solar analog stars
HD 1835,   f, 00:22:51.7, -12:12:34, 6.4,
HD 28099 (H),  f, 04:26:40.1, +16:44:49, 8.1, Hya 64
HD 44594,  f, 06:20:06.1, -48:44:28, 6.6,
HD 76151 (H),  f, 08:54:17.9, -05:26:04, 6.0,
HD 89010,  f, 10:16:32.3, +23:30:11, 5.9,
HD 144585, f, 16:07:03.3, -14:04:17, 6.3,
HD 159222, f, 17:32:00.9, +34:16:16, 6.6,
HD 181655, f, 19:19:38.9, +37:19:50, 6.3,
HD 186427 (H), f, 19:41:51.9, +50:31:03, 6.2, 16 Cyg B
HD 191854 (H), f, 20:10:13.3, +43:56:44, 7.4,

# Other very good and no so bright stars
Hyades 142, f, 04:46:30.0, +15:28:20.7, 8.3, HD 30246; used by VLT LP
HD44594,    f, 06:20:04.9, -48:44:14.6, 6.6,
HD144873,   f, 16:06:41.1, +34:06:01.6, 8.5,

# From James 'Gerbs' Bauer:
HD 2966  , f, 00 32 50.1, -13 15 27.5,  8.8, G5V; used by Hainaut
HD 1368     , f, 00 17 54.6, +00 22 40.2,  8.9, F9V; well calibrated
HD 2141     , f, 00 25 32.7, -16 08 00.0,  8.9, G3V
HD 147284, f, 16 21 55.4, -24 59 28.7,  8.8, G3V; confirmed
HD 148642, f, 16 30 34.0, -25 28 14.2,  8.7, F7V; no ext. according
HD 147935, f, 16 25 49.1, -27 49 09.2,  9.2, G5V
HD 218251, f, 23 06 39.2, -14 51 49.6,  9.2, G5V; companion 30 arcsec south
HD 210990, f, 22 14 24.2, -16 36 33.7,  9.5, G1V
HD 210078, f, 22 08 06.4, -11 53 00.3, 10.2, G3V; star 2.5 arcmin east
HD 209847, f, 22 06 41.4, -14 44 14.0,  9.8, G2V; used by Dotto/Barucci

# From Farnham et al. stars
HD 11131,  f, 01 49 23.4, -10 42 13, 6.8, G1V; nearby V=5 176´´E, 62´´N
HD 25680,  f, 04 05 20.3, +22 00 32, 5.9, G5V; (39 Tau); IHW; nearby V=9 1.2´´E 173´´N
HD 28099 (F),  f, 04 26 40.1, +16 44 49, 8.1, G2V; vB 64; IHW
HD 29461,  f, 04 38 57.3, +14 06 20, 8.0, G5V; vB 106; IHW
HD 30246,  f, 04 46 30.4, +15 28 19, 8.3, G5V; vB 142; IHW
HD 76151 (F),  f, 08 54 18.0, -05 26 05, 6.0, G3V; IHW
HD 81809,  f, 09 27 46.8, -06 04 17, 5.4, G2V
HD 146233, f, 16 15 36.4, -08 21 45, 5.5, G1V; 18 Sco
HD 186408, f, 19 41 48.9, +50 31 31, 6.0, G1.5V; 16 Cyg A; IHW; double system
HD 186427 (F), f, 19 41 52.0, +50 31 03, 6.2, G2.5V; 16 Cyg B; IHW; double system
HD 191854 (F), f, 20 10 13.3, +43 56 45, 7.4, G5V; IHW
HD 217014, f, 22 57 23.0, +20 46 07, 5.5, G2.5V; 51 Peg
`.trim();

const lewin20 = `
HD 377,      f, 00:08:25.75, +06:37:00.5,  7.5,     G2V-1  7.5 V  6.0 K
HD 1204,     f, 00:16:22.24, -19:23:58.6,  8.7,     G3V-1  8.7 V  7.2 K
CD-25 123,   f, 00:23:38.40, -24:38:54.6, 10.0,      G0-2 10.0 V  8.4 K
BD+48 182,   f, 00:36:43.37, +48:49:41.8,  8.6,      G0-1  8.6 V  7.0 K
HD 3384,     f, 00:36:55.86, +22:18:12.9,  8.8,      G0-1  8.8 V  7.3 K
HD 3964,     f, 00:42:09.78, -03:03:23.0,  8.3,     G5V-1  8.3 V  6.7 K
HD 5372,     f, 00:56:17.37, +52:29:28.5,  7.5,      G5-3  7.5 V  6.0 K
HD 7983,     f, 01:18:59.99, -08:56:22.2,  8.9,     G3V-2  8.9 V  7.4 K
HD 7944,     f, 01:19:26.58, +24:24:11.3,  8.5,      G0-1  8.5 V  7.0 K
HD 8004,     f, 01:20:36.94, +54:57:44.5,  7.2,      G0-1  7.2 V  5.8 K
HD 8100,     f, 01:21:03.98, +38:02:03.1,  7.8,      G0-1  7.8 V  6.3 K
HD 9224,     f, 01:31:19.52, +29:24:47.1,  7.3,     G0V-3  7.3 V  5.8 K
HD 9729,     f, 01:35:01.48, -12:05:06.6,  8.6,     G2V-1  8.6 V  7.1 K
HD 10785,    f, 01:45:16.37, -15:53:44.4,  8.5,   G1/2V-1  8.5 V  7.0 K
HD 11532,    f, 01:53:18.37, +00:22:23.3,  9.7,G8III/IV-1  9.7 V  8.2 K
HD 11616,    f, 01:54:11.98, +09:57:02.3,  7.8,      G5-1  7.8 V  6.3 K
HD 12165,    f, 01:59:27.85, -00:15:10.9,  8.8,   G2/3V-1  8.8 V  7.3 K
HD 13545,    f, 02:12:29.67, +16:42:02.1,  8.1,      G0-1  8.1 V  6.7 K
HD 13931,    f, 02:16:47.38, +43:46:22.8,  7.6,      G0-1  7.6 V  6.1 K
BD-07 435,   f, 02:27:58.43, -07:12:12.7,  9.7,      G0-1  9.7 V  8.2 K
HD 15942,    f, 02:34:03.64, +12:10:51.1,  7.4,      G0-2  7.4 V  5.9 K
HD 17134,    f, 02:44:14.62, -25:29:43.4,  6.9,     G3V-1  6.9 V  5.4 K
HD 20347,    f, 03:17:44.02, +38:38:21.2,  7.2,      G0-2  7.2 V  5.8 K
HD 20939,    f, 03:22:42.17, +02:28:07.0,  8.8,     G2V-1  8.8 V  7.3 K
HD 21630,    f, 03:31:04.08, +39:38:40.9,  8.6,      G0-1  8.6 V  7.1 K
HD 22197,    f, 03:34:42.86, +06:50:35.9,  9.6,      G0-1  9.6 V  8.0 K
HD 22319,    f, 03:36:28.81, +23:47:50.3,  8.6,      G0-1  8.6 V  7.2 K
HD 232816,   f, 03:38:19.40, +52:35:56.7,  9.0,      F5-1  9.0 V  7.5 K
HD 23111,    f, 03:42:37.85, +05:28:42.6,  9.1,      G0-1  9.1 V  7.6 K
HD 23050,    f, 03:43:47.70, +42:36:12.1,  7.4,     G2V-1  7.4 V  5.9 K
HD 285233,   f, 03:55:21.16, +19:22:51.2,  8.8,      G0-1  8.8 V  7.4 K
HD 279209,   f, 04:00:16.12, +37:59:08.3,  9.4,      G0-1  9.4 V  7.9 K
HD 276024,   f, 04:00:29.40, +40:12:09.2,  8.6,      G0-1  8.6 V  7.2 K
HD 26090,    f, 04:08:54.35, +29:11:26.2,  8.2, G0V+G5V-1  8.2 V  6.7 K
HD 279527,   f, 04:11:04.86, +35:13:33.0,  9.2,      G0-1  9.2 V  7.7 K
HD 27486,    f, 04:20:11.38, -04:29:35.2,  8.9,     G2V-1  8.9 V  7.5 K
HD 27748,    f, 04:25:54.88, +57:29:42.4,  8.5,      G5-1  8.5 V  7.0 K
HD 28099,    f, 04:26:40.12, +16:44:48.8,  8.1,     G2V-1  8.1 V  6.5 K
HD 28192,    f, 04:26:48.82, -01:43:28.6,  8.0,     G0V-1  8.0 V  6.5 K
HD 29461,    f, 04:38:57.31, +14:06:20.1,  7.9,      G5-1  7.9 V  6.4 K
HD 30625,    f, 04:49:19.29, -00:52:10.6,  8.6,     G3V-1  8.6 V  7.0 K
HD 30572,    f, 04:49:48.03, +23:23:44.7,  8.5,      G0-1  8.5 V  7.0 K
HD 32658,    f, 05:05:26.77, +13:48:10.7,  9.2,      G0-2  9.2 V  7.8 K
HD 33366,    f, 05:10:44.54, +25:08:29.4,  8.4,      G5-3  8.4 V  6.9 K
HD 34031,    f, 05:15:11.60, +20:03:21.9,  7.7,      G0-2  7.7 V  6.1 K
BD-18 1066,  f, 05:21:54.85, -18:50:20.9, 10.1,      G0-1 10.1 V  8.5 K
HD 36108,    f, 05:28:21.03, -22:26:02.1,  6.7,     F9V-2  6.7 V  5.2 K
HD 37685,    f, 05:40:46.35, +09:15:55.6,  7.9,      G0-1  7.9 V  6.4 K
HD 246128,   f, 05:40:46.46, +26:59:53.4,  9.0,      G0-1  9.0 V  7.5 K
BD-16 1205,  f, 05:41:35.30, -16:26:04.3,  9.0,      G0-1  9.0 V  7.5 K
HD 246629,   f, 05:42:49.64, +19:50:50.9,  9.4,      G0-1  9.4 V  7.9 K
HD 37693,    f, 05:43:26.85, +52:29:19.6,  7.1,      G0-1  7.1 V  5.6 K
HD 38466,    f, 05:45:09.11, -22:15:45.8,  9.3,     G1V-1  9.3 V  7.8 K
HD 248712,   f, 05:53:39.77, +33:44:15.1,  8.8,      G0-3  8.8 V  7.4 K
HD 250285,   f, 06:01:18.25, +27:16:52.8,  9.1,      G0-1  9.1 V  7.7 K
HD 41478,    f, 06:07:10.00, +37:09:51.4,  8.6,      G0-2  8.6 V  7.1 K
BD+66 436,   f, 06:15:45.02, +66:08:07.4,  9.0,      F2-1  9.0 V  8.0 K
HD 43965,    f, 06:20:05.02, +24:34:00.3,  7.6,      G0-1  7.6 V  6.1 K
HD 45580,    f, 06:29:03.70, +17:44:42.8,  7.6,      G0-1  7.6 V  6.1 K
HD 49158,    f, 06:51:10.33, +62:13:46.3,  8.6,      G0-1  8.6 V  7.1 K
HD 50694,    f, 06:54:48.09, +11:25:56.0,  8.0,      G0-2  8.0 V  6.5 K
HD 51708,    f, 07:03:46.17, +67:27:25.2,  7.7,      G0-3  7.7 V  6.2 K
HD 53991,    f, 07:08:51.08, +37:31:30.3,  8.6,      G0-1  8.6 V  7.1 K
HD 60513,    f, 07:34:13.16, -16:11:16.0,  6.7,     G2V-1  6.7 V  5.2 K
HD 62928,    f, 07:46:51.37, +14:03:19.6,  8.4,      G0-1  8.4 V  6.9 K
BD+33 1603,  f, 07:51:13.10, +32:58:47.6,  9.1,      G0-1  9.1 V  7.6 K
HD 64942,    f, 07:55:58.23, -09:47:49.9,  8.3,   G3/5V-1  8.3 V  6.8 K
HD 69270,    f, 08:16:06.58, -05:14:32.0,  9.3,     G3V-1  9.3 V  7.9 K
HD 71848,    f, 08:29:55.73, +10:28:14.8,  8.0,      G0-1  8.0 V  6.6 K
HD 72892,    f, 08:34:52.59, -14:27:24.1,  8.7,     G5V-1  8.7 V  7.1 K
HD 73510,    f, 08:39:37.12, +24:37:13.6,  8.8,      G5-1  8.8 V  7.4 K
HD 76151,    f, 08:54:17.95, -05:26:04.0,  6.0,     G2V-1  6.0 V  4.5 K
BD+26 1904,  f, 09:10:25.85, +25:48:58.6, 10.0,      G0-2 10.0 V  8.5 K
HD 79282,    f, 09:14:14.56, +33:49:00.9,  8.2,      G5-1  8.2 V  6.7 K
HD 83789,    f, 09:41:11.49, +11:33:25.5,  8.7,      G0-1  8.7 V  7.2 K
HD 86811,    f, 10:01:55.85, +37:44:36.1,  8.9,      F8-2  8.9 V  7.7 K
HD 90681,    f, 10:28:51.39, +34:53:08.4,  7.8,      G0-2  7.8 V  6.4 K
HD 91768,    f, 10:36:22.56, +35:07:20.0,  8.8,      G5-1  8.8 V  7.3 K
HD 95311,    f, 11:00:36.82, +23:42:21.9,  8.6,      G0-1  8.6 V  7.1 K
HD 100022,   f, 11:30:26.09, -15:19:19.7,  9.3,     G2V-1  9.3 V  7.8 K
BD+07 2471,  f, 11:41:57.34, +06:48:24.6,  9.8,      G5-1  9.8 V  8.3 K
HD 103549,   f, 11:55:23.69, -03:35:58.1,  8.7,   G2/3V-1  8.7 V  7.2 K
HD 104516,   f, 12:02:13.46, -27:38:52.4,  8.8,     G0V-1  8.8 V  7.3 K
HD 104924,   f, 12:04:53.51, +09:10:20.5,  9.4,      G0-1  9.4 V  8.0 K
HD 105901,   f, 12:11:17.86, -05:55:33.9,  8.1,   G3/5V-1  8.1 V  6.6 K
BD+27 2103,  f, 12:13:30.59, +27:02:36.5,  9.9,      G0-1  9.9 V  8.4 K
HD 109098,   f, 12:32:04.45, -01:46:20.5,  7.3,   G3/5V-3  7.3 V  5.8 K
BD+39 2571,  f, 12:51:40.44, +38:22:06.8, 10.3,      G5-1 10.3 V  8.7 K
HD 115269,   f, 13:15:19.20, +52:16:40.3,  9.0,      G0-3  9.0 V  7.5 K
HD 118034,   f, 13:33:57.66, +17:28:05.0,  8.8,      G0-1  8.8 V  7.3 K
HD 119856,   f, 13:46:17.64, -30:28:28.1,  8.2,     G1V-1  8.2 V  6.7 K
HD 120050,   f, 13:46:57.91, +06:01:37.7,  9.2,   G5III-3  9.2 V  7.7 K
BD+66 844,   f, 14:23:40.91, +65:23:43.8,  9.2,      G5-1  9.2 V  7.7 K
BD+072790,   f, 14:27:55.15, +06:57:05.9,  9.2,      G0-1  9.2 V  7.7 K
HD 129171,   f, 14:40:18.39, +30:26:37.8,  7.6,      G0-1  7.6 V  6.2 K
BD+24 2757,  f, 14:41:18.10, +23:43:19.6,  9.0,      G0-1  9.0 V  7.5 K
HD 131526,   f, 14:52:20.91, +48:40:14.7,  7.6,      G0-1  7.6 V  6.1 K
HD 131715,   f, 14:55:16.18, -02:06:50.7,  8.9,     F8V-1  8.9 V  7.4 K
HD 131790,   f, 14:56:02.54, -15:39:23.5,  8.0,     G0V-3  8.0 V  6.5 K
BD+24 2810,  f, 15:01:18.07, +23:51:02.8,  9.3,      G0-1  9.3 V  7.8 K
HD 134533,   f, 15:10:03.01, +12:20:38.7,  9.3,      G0-1  9.3 V  7.8 K
BD-08 3922,  f, 15:13:44.73, -08:37:12.0,  9.6,      G0-1  9.6 V  8.0 K
HD 137272,   f, 15:25:32.69, -13:44:04.6,  9.3,   G2/3V-1  9.3 V  7.8 K
HD 137723,   f, 15:27:18.07, +09:42:00.3,  7.9,      G0-1  7.9 V  6.5 K
HD 137775,   f, 15:27:35.07, +09:53:14.6,  8.9,      G0-1  8.9 V  7.5 K
HD 138278,   f, 15:29:57.63, +32:37:07.5,  8.3,      G0-1  8.3 V  6.8 K
HD 138573,   f, 15:32:43.65, +10:58:05.9,  7.2,  G5IV-V-1  7.2 V  5.7 K
HD 139287,   f, 15:37:18.15, -00:09:49.7,  8.4,   G2/3V-1  8.4 V  6.8 K
HD 141715,   f, 15:50:26.06, +01:49:08.3,  8.2,     G3V-1  8.2 V  6.7 K
HD 143436,   f, 16:00:18.84, +00:08:13.2,  8.0,     G3V-3  8.0 V  6.5 K
HD 144873,   f, 16:06:40.00, +34:06:10.5,  8.5,      G5-2  8.5 V  6.9 K
HD 145478,   f, 16:11:06.41, +02:54:51.7,  8.6,     G5V-1  8.6 V  7.1 K
HD 146070,   f, 16:15:19.09, -27:12:36.9,  7.5,     G1V-1  7.5 V  6.0 K
HD 153227,   f, 16:58:00.44, +02:20:31.1,  9.8,   G3/5V-2  9.8 V  8.4 K
HD 153631,   f, 17:01:10.76, -13:34:01.7,  7.1,     G0V-1  7.1 V  5.5 K
HD 153994,   f, 17:02:21.38, +12:24:50.3,  9.5,      G0-1  9.5 V  8.1 K
HD 154064,   f, 17:02:42.73, +12:56:32.2,  8.3,      G5-2  8.3 V  6.8 K
HD 234382,   f, 17:04:30.40, +52:09:42.1,  8.5,      G0-1  8.5 V  7.0 K
HD 159222,   f, 17:32:00.99, +34:16:16.1,  6.5,     G1V-3  6.5 V  4.9 K
HD 159333,   f, 17:33:52.82, +08:06:13.6,  8.8,      G0-1  8.8 V  6.3 K
HD 162209,   f, 17:48:13.08, +38:13:57.3,  7.7,      G0-1  7.7 V  6.2 K
HD 163492,   f, 17:56:43.12, -09:00:53.3,  8.6,     G3V-1  8.6 V  7.1 K
HD 165290,   f, 18:06:17.29, -26:17:02.7,  9.0,     G1V-2  9.0 V  7.5 K
HD 165672,   f, 18:06:48.81, +06:24:38.0,  7.7,      G5-1  7.7 V  6.2 K
HD 348088,   f, 18:13:06.93, +20:19:34.3,  8.9,      G0-1  8.9 V  7.5 K
HD 167065,   f, 18:13:18.79, +09:05:49.3,  8.0,      G0-1  8.0 V  6.5 K
HD 169359,   f, 18:23:47.06, +14:54:27.8,  7.8,      G0-1  7.8 V  6.3 K
BD+28 2993,  f, 18:24:11.62, +28:17:25.1,  9.1,      G0-1  9.1 V  7.6 K
HD 170331,   f, 18:29:52.02, -26:01:31.4,  8.8,     G5V-1  8.8 V  7.3 K
BD+35 3269,  f, 18:30:25.63, +35:43:39.1,  9.1,      G5-2  9.1 V  7.6 K
SA 110-361,  f, 18:42:45.01, +00:08:04.7, 12.4,     N/A-1 12.4 V  0.8 K
HD 174466,   f, 18:51:15.80, -16:09:42.5,  8.8,     G2V-1  8.8 V  6.8 K
HD 175179,   f, 18:54:23.20, -04:36:18.6,  9.0,     G5V-3  9.0 V  7.5 K
HD 175702,   f, 18:56:05.80, +15:21:56.4,  7.6,      G0-1  7.6 V  6.1 K
HD 176972,   f, 19:01:53.16, +19:10:11.7,  7.8,      G5-2  7.8 V  6.3 K
HD 177780,   f, 19:04:16.38, +41:00:11.4,  8.3,     G3V-1  8.3 V  6.9 K
HD 231043,   f, 19:16:38.92, +16:40:04.9,  9.2,      G0-2  9.2 V  7.7 K
HD 183542,   f, 19:30:35.74, -11:33:43.9,  9.7,   G2/3V-1  9.7 V  8.1 K
HD 184403,   f, 19:33:26.21, +23:29:51.0,  7.8,      G0-2  7.8 V  6.2 K
HD 186427,   f, 19:41:51.97, +50:31:03.1,  6.2,     G3V-1  6.2 V  4.7 K
HD 186413,   f, 19:44:04.39, +03:30:27.8,  7.9,     G3V-1  7.9 V  6.5 K
HD 186932,   f, 19:46:37.82, +17:48:10.5,  8.1,      G0-1  8.1 V  6.6 K
HD 187876,   f, 19:49:12.18, +57:24:33.6,  7.7,      G0-1  7.7 V  6.3 K
HD 187897,   f, 19:52:09.39, +07:27:36.2,  7.1,      G5-1  7.1 V  5.7 K
HD 190524,   f, 20:05:48.70, -15:45:22.4,  8.4,     G3V-1  8.4 V  6.9 K
HD 346383,   f, 20:21:25.03, +23:31:15.6,  8.8,      G0-1  8.8 V  7.3 K
HD 196361,   f, 20:35:38.59, +36:28:29.7,  8.2,      G5-1  8.2 V  6.7 K
HD 197195,   f, 20:41:53.31, +12:58:49.6,  8.2,      G5-1  8.2 V  6.9 K
BD-00 4074,  f, 20:43:11.96, +00:26:13.1,  9.9,      F8-3  9.9 V  8.5 K
HD 198176,   f, 20:49:24.55, -26:56:14.7,  8.7,     G2V-3  8.7 V  7.2 K
HD 199221,   f, 20:55:02.41, +28:05:25.8,  7.8,     G2V-1  7.8 V  6.3 K
HD 353253,   f, 20:55:30.44, +19:41:11.0,  9.2,      G0-1  9.2 V  7.7 K
HD 199898,   f, 21:00:27.76, -16:22:08.1,  9.9,     G2V-3  9.9 V  8.3 K
HD 200633,   f, 21:04:44.15, -04:49:44.0,  8.3,     G5V-1  8.3 V  6.8 K
HD 203311,   f, 21:21:51.08, -16:16:25.9,  7.4,     G2V-1  7.4 V  5.9 K
BD+22 4443,  f, 21:38:01.02, +22:49:08.5,  9.3,      G0-1  9.3 V  7.9 K
BD+03 4598,  f, 21:40:41.80, +04:15:08.5,  9.7,      G0-1  9.7 V  8.1 K
BD-00 4251B, f, 21:42:27.45, +00:26:20.3,  9.1,      F8-1  9.1 V  7.5 K
HD 209793,   f, 22:05:52.20, +12:32:47.5,  8.6,      G5-1  8.6 V  7.1 K
HD 210388,   f, 22:09:22.50, +35:07:45.3,  7.4,      G0-1  7.4 V  5.9 K
BD+26 4382,  f, 22:13:47.31, +27:07:19.9,  9.1,      G0-1  9.1 V  7.6 K
HD 211320,   f, 22:14:47.86, +57:42:38.7,  8.6,      G0-1  8.6 V  7.1 K
HD 211476,   f, 22:17:15.14, +12:53:54.6,  7.0,     G2V-1  7.0 V  5.5 K
BD+06 4993,  f, 22:17:37.41, +07:13:44.0,  9.4,      G0-1  9.4 V  7.9 K
HD 212029,   f, 22:20:23.87, +46:25:05.8,  8.5,      G0-1  8.5 V  7.1 K
HD 212083,   f, 22:21:59.97, -19:26:07.5,  7.8,     G3V-1  7.8 V  6.3 K
HD 212680,   f, 22:25:41.78, +24:06:01.4,  8.9,      G0-3  8.9 V  7.9 K
HD 212816,   f, 22:27:14.89, -12:28:33.1,  9.4,   G3/5V-1  9.4 V  8.0 K
HD 215428,   f, 22:44:53.41, +18:01:43.8,  8.5,      G0-1  8.5 V  7.1 K
HD 216505,   f, 22:53:38.72, -16:14:28.9,  8.9,     F7V-1  8.9 V  7.7 K
HD 217014,   f, 22:57:27.98, +20:46:07.8,  5.4,    G2IV-1  5.4 V  3.9 K
HD 217443,   f, 23:00:37.13, +08:45:01.6,  8.0,      G0-1  8.0 V  6.5 K
HD 217458,   f, 23:00:46.03, +03:20:37.3,  8.5,  F8/G0V-1  8.5 V  7.0 K
HD 218647,   f, 23:09:48.98, -07:05:24.3,  8.6,   G1/2V-2  8.6 V  7.1 K
HD 220284,   f, 23:22:08.80, +49:32:01.6,  7.9,      G5-1  7.9 V  6.4 K
HD 220500,   f, 23:23:54.23, +37:24:20.7,  8.4,      G0-1  8.4 V  6.9 K
HD 220773,   f, 23:26:27.44, +08:38:37.8,  7.1,      G0-1  7.1 V  5.7 K
HD 220845,   f, 23:26:49.69, +36:06:13.7,  8.4,      G5-3  8.4 V  6.9 K
SA 115-271,  f, 23:42:41.82, +00:45:13.1,  9.6,      F8-1  9.6 V  8.0 K
HD 222788,   f, 23:43:34.70, +19:07:47.4,  9.0,     F3V-3  9.0 V  8.0 K
HD 222814,   f, 23:43:50.66, -06:16:24.8,  8.5,     G2V-1  8.5 V  7.0 K
HD 223238,   f, 23:47:52.41, +04:10:31.7,  7.6,     G5V-1  7.6 V  6.1 K
BD+17 4993,  f, 23:51:14.65, +18:21:32.3,  9.4,      G0-1  9.4 V  8.0 K
HD 224465,   f, 23:58:06.82, +50:26:51.6,  6.6,     G4V-1  6.6 V  5.1 K
`.trim()

export function useDownloadableText(text) {
  const [url, setURL] = React.useState(null);
  React.useEffect(() => {
    // https://javascript.info/blob
    const blob = new Blob([text], { type: 'text/plain' });
    const _url = URL.createObjectURL(blob);
    setURL(_url);
    return () => {
      URL.revokeObjectURL(_url);
    }
  }, [text]);
  return url;
}

export default function LoadTargets({ targets, targetDispatch, addMessage }) {
  const [targetTextArea, setTargetTextArea] = React.useState(`
# Target,        Type, RA,       Dec,       mV, Notes
2P/Encke,        m,    ,         ,          ,   classic
C/2022 E3 (ZTF), m
16 Cyg B,        f,    19 41 52, +50 31 03, 6,  G3V
`.trim());
  const url = useDownloadableText(targetTextArea);

  const readFile = (event) => {
    event.preventDefault();
    const reader = new FileReader();
    reader.onload = (f) => {
      setTargetTextArea(f.target.result);
    };
    reader.readAsText(event.target.files[0]);
  };

  const addTargets = () => {
    let error = false;
    const newTargets = textToTargets(targetTextArea);
    const targetNames = targets.map((target) => target.name);

    const repeatedTargets = newTargets.filter((target) =>
      newTargets.filter((t) => target.name === t.name).length > 1
    );
    if (repeatedTargets.length) {
      addMessage({
        severity: 'error',
        text: 'Error, text area has duplicate target names: '
          + repeatedTargets.map((target) => target.name).join(', ')
      });
      error = true;
    }

    const duplicateTargets = newTargets.filter((target) => targetNames.includes(target.name));
    if (duplicateTargets.length) {
      addMessage({
        severity: 'error',
        text: 'Error, text area and table must have unique target names: '
          + duplicateTargets.map((target) => target.name).join(', ')
      });
      error = true;
    }

    if (!error && newTargets.length) {
      targetDispatch({ type: 'append targets', targets: newTargets });
      addMessage({
        severity: 'info',
        text: `Added: ${newTargets.map((target) => target.name).join(', ')}.`
      });
    }

    const position = error
      ? document.getElementById('elevation-console').offsetTop
      : document.getElementById('elevation-plot-area').offsetTop;
    scroll.scrollTo(position, {
      duration: 1000,
      delay: 50,
      smooth: 'easeInOutQuint'
    });
  }

  const pullTargets = () => {
    const maxNameWidth = Math.max(...targets.map((target) => target.name.length));
    const header = `# Target,${" ".repeat(maxNameWidth - 8)} Type, RA,         Dec,       mV,   Notes`;
    const lines = targets.map((target) => {
      if (target.moving)
        return `${target.name},${" ".repeat(maxNameWidth - target.name.length)} m,    ,           ,          ,     ${target.notes}`;
      else
        return `${target.name},${" ".repeat(maxNameWidth - target.name.length)} f,    ${target.ra.hms(1, 2)}, ${target.dec.dms()}, ${" ".repeat(Math.max(0, 4 - target.mV.length))}${target.mV}, ${target.notes}`;
    });
    setTargetTextArea([header, ...lines].join('\n'));
  };

  const downloadFile = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = url.split('/').pop();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return <div className="box elevation-ui">
    <h2>Load targets</h2>
    <ul>
      <li>Columns: Target, Type, RA, Dec, mV, Notes.</li>
      <li>Type: m for a moving target.</li>
      <li>RA and Dec may be any sensible format, e.g., -12, -12d 34m,
        12h34m56s, 12:34:56.78.</li>
      <li>RA and Dec is ignored for Solar System targets.</li>
    </ul>

    <div id='elevation-load-target-control'>
      <textarea
        rows="20"
        cols="72"
        value={targetTextArea}
        onChange={(event) => setTargetTextArea(event.target.value)}
      />
      <br />
      <button onClick={addTargets}>Add targets</button>
      <input id="elevation-open-file" type="file" onChange={readFile} />
      <button onClick={downloadFile}>Save file</button>
      <hr />
      <button onClick={() => setTargetTextArea(ldtTargets)}>LDT comets</button>
      <button onClick={() => setTargetTextArea(lookTargets)}>LOOK targets</button>
      <button onClick={() => setTargetTextArea(jwstCycle1)}>JWST Cycle 1 comets</button>
      <button onClick={() => setTargetTextArea(jwstCycle2)}>JWST Cycle 2 comets</button>
      <button onClick={() => setTargetTextArea(cometaryOrbitalTrends)}>Orbital Trends</button>
      <br />
      <button onClick={() => setTargetTextArea(hbStandards)}>HB filter standards</button>
      <button onClick={() => setTargetTextArea(delsantiAnalogs)}>Delsanti solar analog list</button>
      <button onClick={() => setTargetTextArea(lewin20)}>Lewin et al. 2020</button>
      <br />
      <button onClick={pullTargets}>From table</button>
    </div>

  </div>;
}