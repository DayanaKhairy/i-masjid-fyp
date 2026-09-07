// lib/screens/prayer_screen.dart
import 'dart:async';
import 'package:flutter/material.dart';
import '../services/prayer_service.dart';
import '../main.dart' show kBgColor, kSurfaceColor, kTeal, kAmber, kDivider;

class PrayerScreen extends StatefulWidget {
  const PrayerScreen({super.key});
  @override
  State<PrayerScreen> createState() => _PrayerScreenState();
}

class _PrayerScreenState extends State<PrayerScreen> {
  PrayerTimes _times = PrayerTimes.fallback;
  bool _isLive = false;
  Duration _countdown = Duration.zero;
  Timer? _timer;

  static const _prayerEmoji = {
    'Fajr':   '🌄',
    'Syuruk': '🌅',
    'Dhuhr':  '☀️',
    'Asr':    '🌤️',
    'Maghrib':'🌇',
    'Isyak':  '🌙',
  };

  @override
  void initState() {
    super.initState();
    _fetch();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _countdown = _times.countdownToNext());
    });
  }

  @override
  void dispose() { _timer?.cancel(); super.dispose(); }

  Future<void> _fetch() async {
    final t = await PrayerService.fetchTodayTimes();
    if (mounted) setState(() { _times = t; _isLive = true; });
  }

  String _fmt(String t) {
    final p = t.split(':');
    var h = int.parse(p[0]);
    final m = p[1];
    final ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 == 0 ? 12 : h % 12;
    return '$h:$m $ap';
  }

  String _fmtCountdown(Duration d) {
    final h = d.inHours;
    final m = (d.inMinutes % 60).toString().padLeft(2, '0');
    final s = (d.inSeconds % 60).toString().padLeft(2, '0');
    return h > 0 ? '${h}h ${m}m ${s}s' : '${m}m ${s}s';
  }

  String _displayName(String key) => key == 'Isyak' ? 'Isha' : key;

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    const months = ['Jan','Feb','Mar','Apr','May','Jun',
                    'Jul','Aug','Sep','Oct','Nov','Dec'];
    const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    final next = _times.nextPrayerName;

    return Scaffold(
      backgroundColor: kBgColor,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // ── App bar ──
            SliverAppBar(
              backgroundColor: kBgColor,
              floating: true,
              title: const Text('Prayer Times',
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
              centerTitle: true,
              actions: [
                IconButton(
                  onPressed: _fetch,
                  icon: Icon(Icons.refresh_rounded,
                      color: _isLive ? kTeal : kAmber, size: 22),
                  tooltip: 'Refresh',
                ),
              ],
            ),

            // ── Date strip ──
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 4, 20, 0),
                child: Row(children: [
                  Text(
                    '${months[now.month - 1]} ${now.year}',
                    style: const TextStyle(
                        color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                ]),
              ),
            ),

            // ── Weekly day row ──
            SliverToBoxAdapter(
              child: SizedBox(
                height: 72,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  itemCount: 7,
                  itemBuilder: (_, i) {
                    final dayOffset = i - now.weekday + 1;
                    final d = now.add(Duration(days: dayOffset));
                    final isToday = d.day == now.day;
                    return Container(
                      width: 44,
                      margin: const EdgeInsets.only(right: 8),
                      decoration: BoxDecoration(
                        color: isToday ? kSurfaceColor : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                        border: isToday
                            ? Border.all(color: const Color(0xFF3C3C3C))
                            : null,
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(dayNames[i],
                              style: TextStyle(
                                fontSize: 11,
                                color: isToday ? Colors.white : const Color(0xFF6B6B6B),
                                fontWeight: isToday ? FontWeight.w600 : FontWeight.w400,
                              )),
                          const SizedBox(height: 4),
                          Text('${d.day}',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: isToday ? Colors.white : const Color(0xFF6B6B6B),
                              )),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 8)),

            // ── Countdown pill ──
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
                  decoration: BoxDecoration(
                    color: kTeal.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: kTeal.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      Text(_prayerEmoji[next] ?? '🕌',
                          style: const TextStyle(fontSize: 24)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text('Next: ${_displayName(next)}',
                              style: const TextStyle(
                                  color: Colors.white70, fontSize: 12)),
                          Text(_fmtCountdown(_countdown),
                              style: const TextStyle(
                                  fontSize: 22, fontWeight: FontWeight.w700,
                                  color: Colors.white)),
                        ]),
                      ),
                      Row(children: [
                        Container(
                          width: 7, height: 7,
                          decoration: BoxDecoration(
                            color: _isLive ? kTeal : kAmber,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 5),
                        Text(_isLive ? 'Live' : 'Offline',
                            style: TextStyle(
                              fontSize: 11,
                              color: _isLive ? kTeal : kAmber,
                              fontWeight: FontWeight.w600,
                            )),
                      ]),
                    ],
                  ),
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 20)),

            // ── Prayer list (like reference) ──
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
                      ..._times.asList.map((e) {
                        final isActive = e.key == next;
                        return Column(
                          children: [
                            if (_times.asList.first.key != e.key)
                              const Divider(
                                  height: 1, color: Colors.white12,
                                  indent: 20, endIndent: 20),
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 300),
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
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 20, vertical: 14),
                                child: Row(
                                  children: [
                                    Text(_prayerEmoji[e.key] ?? '🕌',
                                        style: const TextStyle(fontSize: 20)),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: Text(
                                        _displayName(e.key),
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 16,
                                          fontWeight: isActive
                                              ? FontWeight.w700
                                              : FontWeight.w400,
                                        ),
                                      ),
                                    ),
                                    Text(
                                      _fmt(e.value),
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 16,
                                        fontWeight: isActive
                                            ? FontWeight.w800
                                            : FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        );
                      }),
                      // Footer
                      const Divider(color: Colors.white24, height: 1),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
                        child: Row(children: [
                          const Icon(Icons.navigation, color: Colors.white70, size: 14),
                          const SizedBox(width: 6),
                          const Text('Seluruh Negeri Melaka (MLK001)',
                              style: TextStyle(color: Colors.white70, fontSize: 12)),
                          const Spacer(),
                          const Icon(Icons.info_outline, color: Colors.white54, size: 14),
                          const SizedBox(width: 4),
                          const Text('JAKIM, Malaysia',
                              style: TextStyle(color: Colors.white54, fontSize: 12)),
                        ]),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 24)),

            // ── Qibla info ──
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: kSurfaceColor,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: kDivider),
                  ),
                  child: const Row(children: [
                    Text('🧭', style: TextStyle(fontSize: 28)),
                    SizedBox(width: 14),
                    Expanded(child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('Qibla Direction',
                          style: TextStyle(fontWeight: FontWeight.w600,
                              fontSize: 14, color: Colors.white)),
                      SizedBox(height: 2),
                      Text('From Melaka: ~292° NW',
                          style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 12)),
                    ])),
                    Icon(Icons.chevron_right, color: Color(0xFF6B6B6B)),
                  ]),
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
