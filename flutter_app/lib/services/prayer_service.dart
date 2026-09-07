// lib/services/prayer_service.dart
// Fetches live prayer times from Aladhan API (same source as web app)

import 'dart:convert';
import 'package:http/http.dart' as http;

class PrayerTimes {
  final String fajr;
  final String syuruk;
  final String dhuhr;
  final String asr;
  final String maghrib;
  final String isyak;

  const PrayerTimes({
    required this.fajr,
    required this.syuruk,
    required this.dhuhr,
    required this.asr,
    required this.maghrib,
    required this.isyak,
  });

  // Fallback hardcoded times for Melaka
  static const PrayerTimes fallback = PrayerTimes(
    fajr:    '05:48', syuruk: '07:02', dhuhr:   '13:12',
    asr:     '16:34', maghrib:'19:18', isyak:   '20:31',
  );

  factory PrayerTimes.fromJson(Map<String, dynamic> timings) {
    return PrayerTimes(
      fajr:    _trim(timings['Fajr']    as String? ?? '05:48'),
      syuruk:  _trim(timings['Sunrise'] as String? ?? '07:02'),
      dhuhr:   _trim(timings['Dhuhr']   as String? ?? '13:12'),
      asr:     _trim(timings['Asr']     as String? ?? '16:34'),
      maghrib: _trim(timings['Maghrib'] as String? ?? '19:18'),
      isyak:   _trim(timings['Isha']    as String? ?? '20:31'),
    );
  }

  // Remove timezone suffix (e.g. "05:48 (+08)")
  static String _trim(String t) => t.split(' ').first;

  List<MapEntry<String, String>> get asList => [
    MapEntry('Fajr',    fajr),
    MapEntry('Syuruk',  syuruk),
    MapEntry('Dhuhr',   dhuhr),
    MapEntry('Asr',     asr),
    MapEntry('Maghrib', maghrib),
    MapEntry('Isyak',   isyak),
  ];

  String get nextPrayerName {
    final now = DateTime.now();
    final nowM = now.hour * 60 + now.minute;
    for (final e in asList) {
      if (e.key == 'Syuruk') continue; // not a solat
      final parts  = e.value.split(':');
      final pMin   = int.parse(parts[0]) * 60 + int.parse(parts[1]);
      if (nowM < pMin) return e.key;
    }
    return 'Fajr'; // tomorrow
  }

  Duration countdownToNext() {
    final now = DateTime.now();
    final nowSecs = now.hour * 3600 + now.minute * 60 + now.second;
    final ordered = asList.where((e) => e.key != 'Syuruk').toList();
    for (final e in ordered) {
      final parts = e.value.split(':');
      final pSecs = int.parse(parts[0]) * 3600 + int.parse(parts[1]) * 60;
      if (nowSecs < pSecs) return Duration(seconds: pSecs - nowSecs);
    }
    // After Isyak — count to Fajr tomorrow
    final fParts = fajr.split(':');
    final fSecs  = int.parse(fParts[0]) * 3600 + int.parse(fParts[1]) * 60 + 86400;
    return Duration(seconds: fSecs - nowSecs);
  }
}

class PrayerService {
  static const _apiUrl =
      'https://api.aladhan.com/v1/timingsByCity?city=Melaka&country=Malaysia&method=3';

  static Future<PrayerTimes> fetchTodayTimes() async {
    try {
      final resp = await http.get(Uri.parse(_apiUrl)).timeout(const Duration(seconds: 8));
      if (resp.statusCode == 200) {
        final json = jsonDecode(resp.body) as Map<String, dynamic>;
        if (json['code'] == 200) {
          return PrayerTimes.fromJson(json['data']['timings'] as Map<String, dynamic>);
        }
      }
    } catch (_) { /* fall through to fallback */ }
    return PrayerTimes.fallback;
  }
}
