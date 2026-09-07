// lib/screens/home_screen.dart
import 'package:flutter/material.dart';
import '../services/prayer_service.dart';
import '../main.dart' show kBgColor, kSurfaceColor, kSurface2, kTeal, kTealDark, kAmber, kDivider;

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  PrayerTimes _times = PrayerTimes.fallback;
  bool _isLive = false;
  Duration _countdown = Duration.zero;

  @override
  void initState() {
    super.initState();
    _load();
    _tick();
  }

  Future<void> _load() async {
    final t = await PrayerService.fetchTodayTimes();
    if (mounted) setState(() { _times = t; _isLive = true; });
  }

  void _tick() {
    Future.delayed(const Duration(seconds: 1), () {
      if (!mounted) return;
      setState(() => _countdown = _times.countdownToNext());
      _tick();
    });
  }

  String _fmtDuration(Duration d) {
    final h = d.inHours;
    final m = (d.inMinutes % 60).toString().padLeft(2, '0');
    final s = (d.inSeconds % 60).toString().padLeft(2, '0');
    return h > 0 ? '${h}h ${m}m ${s}s' : '${m}m ${s}s';
  }

  String _fmt(String t) {
    final p = t.split(':');
    var h = int.parse(p[0]);
    final m = p[1];
    final ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 == 0 ? 12 : h % 12;
    return '$h:$m $ap';
  }

  String _getNextTime() {
    for (final e in _times.asList) {
      if (e.key == _times.nextPrayerName) return e.value;
    }
    return _times.fajr;
  }

  // Simple Hijri approximation
  String _hijriDate() {
    final now = DateTime.now();
    // rough offset: ~622 solar years difference
    final hjYear = now.year - 622 + (now.month > 6 ? 1 : 0);
    const hjMonths = ['Muharram','Safar','Rabi\' I','Rabi\' II','Jumada I','Jumada II',
      'Rajab','Sha\'ban','Ramadan','Shawwal','Dhul Qa\'dah','Dhul Hijjah'];
    final hjMonth = hjMonths[(now.month + 5) % 12];
    return '${now.day} $hjMonth ${hjYear}AH';
  }

  String _gregDate() {
    final now = DateTime.now();
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    final day = days[now.weekday - 1];
    return '$day, ${now.day} ${months[now.month - 1]} ${now.year}';
  }

  @override
  Widget build(BuildContext context) {
    final prayerIcons = {
      'Fajr':   '🌄', 'Syuruk': '🌅', 'Dhuhr': '☀️',
      'Asr':    '🌤️', 'Maghrib':'🌇', 'Isyak': '🌙',
    };

    return Scaffold(
      backgroundColor: kBgColor,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // ── Header ──
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(
                        _gregDate(),
                        style: const TextStyle(
                          fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _hijriDate(),
                        style: const TextStyle(fontSize: 13, color: Color(0xFF9CA3AF)),
                      ),
                    ]),
                    // Profile avatar
                    Container(
                      width: 42, height: 42,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          colors: [kTeal, kTealDark],
                          begin: Alignment.topLeft, end: Alignment.bottomRight,
                        ),
                        border: Border.all(color: kTeal, width: 2),
                      ),
                      child: const Icon(Icons.person, color: Colors.white, size: 22),
                    ),
                  ],
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 20)),

            // ── Prayer Times Card (Teal) ──
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Container(
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF1AAB8A), Color(0xFF127A62)],
                      begin: Alignment.topLeft, end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Column(
                    children: [
                      // Header row
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 18, 20, 12),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '${_times.nextPrayerName} in ${_fmtDuration(_countdown)}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                                fontSize: 16,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.calendar_today_outlined,
                                  color: Colors.white, size: 18),
                            ),
                          ],
                        ),
                      ),
                      // Prayer list
                      ..._times.asList.map((e) {
                        final isActive = e.key == _times.nextPrayerName;
                        return Container(
                          margin: isActive
                              ? const EdgeInsets.symmetric(horizontal: 10, vertical: 4)
                              : EdgeInsets.zero,
                          decoration: isActive
                              ? BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(12),
                                )
                              : null,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 13),
                            child: Row(
                              children: [
                                Text(prayerIcons[e.key] ?? '🕌',
                                    style: const TextStyle(fontSize: 18)),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Text(
                                    e.key == 'Isyak' ? 'Isha' : e.key,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 16,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                                Text(
                                  _fmt(e.value),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }),
                      // Footer
                      const Divider(color: Colors.white24, height: 1),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
                        child: Row(
                          children: [
                            const Icon(Icons.navigation, color: Colors.white70, size: 14),
                            const SizedBox(width: 6),
                            const Text('Seluruh Negeri Melaka (MLK001)',
                                style: TextStyle(color: Colors.white70, fontSize: 12)),
                            const Spacer(),
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.tune, color: Colors.white, size: 16),
                            ),
                          ],
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                        child: Row(
                          children: [
                            const Icon(Icons.info_outline, color: Colors.white54, size: 14),
                            const SizedBox(width: 6),
                            Text(_isLive ? 'JAKIM, Malaysia' : 'Offline data',
                                style: const TextStyle(color: Colors.white54, fontSize: 12)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 28)),

            // ── Feature Grid ──
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: 4,
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 8,
                  childAspectRatio: 0.85,
                  children: const [
                    _FeatureIcon(emoji: '🕌', label: 'Mosque'),
                    _FeatureIcon(emoji: '📅', label: 'Events'),
                    _FeatureIcon(emoji: '🎙️', label: 'Podcast'),
                    _FeatureIcon(emoji: '📣', label: 'Announce'),
                    _FeatureIcon(emoji: '📿', label: 'Dhikr'),
                    _FeatureIcon(emoji: '🧭', label: 'Qibla'),
                    _FeatureIcon(emoji: '🌙', label: 'Ramadan'),
                    _FeatureIcon(emoji: '⚙️', label: 'Settings'),
                  ],
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 28)),

            // ── Promo Banners ──
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    // Dhikr banner
                    Expanded(
                      child: Container(
                        height: 96,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF5C4033), Color(0xFF3E2723)],
                            begin: Alignment.topLeft, end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Row(
                          children: [
                            Text('📿', style: TextStyle(fontSize: 28)),
                            SizedBox(width: 8),
                            Expanded(
                              child: Text('Dhikr &\ndua after\nsolah →',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    height: 1.4,
                                  )),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    // Community banner
                    Expanded(
                      child: Container(
                        height: 96,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF1A237E), Color(0xFF0D1B4B)],
                            begin: Alignment.topLeft, end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Row(
                          children: [
                            Expanded(
                              child: Text('Join\nCommunity →',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    height: 1.4,
                                  )),
                            ),
                            Text('🌐', style: TextStyle(fontSize: 28)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 24)),
          ],
        ),
      ),
    );
  }
}

class _FeatureIcon extends StatelessWidget {
  final String emoji, label;
  const _FeatureIcon({required this.emoji, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 64, height: 64,
          decoration: BoxDecoration(
            color: kSurfaceColor,
            shape: BoxShape.circle,
            border: Border.all(color: kDivider, width: 1.5),
          ),
          child: Center(child: Text(emoji, style: const TextStyle(fontSize: 26))),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: Color(0xFFCCCCCC)),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}
