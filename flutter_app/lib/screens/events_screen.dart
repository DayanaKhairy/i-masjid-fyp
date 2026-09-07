// lib/screens/events_screen.dart

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/event.dart';
import '../services/supabase_service.dart';
import '../main.dart' show kBgColor, kSurfaceColor, kSurface2, kTeal, kAmber, kDivider;

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  List<Event>  _events = [];
  Set<String>  _registered = {};
  String       _filter = 'all';
  bool         _loading = true;

  final _categories = ['all', 'religious', 'education', 'community', 'charity'];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final events = await SupabaseService.getEvents();
    Set<String> regs = {};
    final user = SupabaseService.currentUser;
    if (user != null) {
      regs = await SupabaseService.getUserRegistrations(user['email'] as String);
    }
    if (mounted) setState(() { _events = events; _registered = regs; _loading = false; });
  }

  List<Event> get _filtered =>
      _filter == 'all' ? _events : _events.where((e) => e.category == _filter).toList();

  Future<void> _toggleRegistration(Event ev) async {
    final user = SupabaseService.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in to register for events 👤')));
      return;
    }
    final isReg = _registered.contains(ev.id);
    bool ok;
    if (isReg) {
      ok = await SupabaseService.cancelRegistration(ev.id);
      if (ok) setState(() => _registered.remove(ev.id));
    } else {
      ok = await SupabaseService.registerForEvent(ev.id);
      if (ok) setState(() => _registered.add(ev.id));
    }
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(ok
          ? (isReg ? 'Registration cancelled.' : '✅ Registered for "${ev.title}"!')
          : '⚠️ Something went wrong. Please try again.'),
      ));
    }
  }

  void _openModal(Event ev) {
    final isReg = _registered.contains(ev.id);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF122C20),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => _EventModal(ev: ev, isRegistered: isReg, onToggle: () => _toggleRegistration(ev)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('📅 Events & Programs')),
      body: Column(children: [
        // ── Category filter chips ──
        SizedBox(
          height: 52,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemCount: _categories.length,
            itemBuilder: (_, i) {
              final cat = _categories[i];
              final active = _filter == cat;
              return FilterChip(
                selected: active,
                label: Text(cat[0].toUpperCase() + cat.substring(1)),
                selectedColor: scheme.primary.withValues(alpha: 0.2),
                checkmarkColor: scheme.primary,
                side: BorderSide(color: active ? scheme.primary : const Color(0xFF1E3F30)),
                onSelected: (_) => setState(() => _filter = cat),
              );
            },
          ),
        ),

        // ── Events list ──
        Expanded(
          child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _filtered.isEmpty
              ? Center(child: Text('No events in this category.',
                  style: TextStyle(color: scheme.onSurface.withValues(alpha: 0.4))))
              : RefreshIndicator(
                  onRefresh: _loadData,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _filtered.length,
                    itemBuilder: (_, i) => _EventCard(
                      event: _filtered[i],
                      isRegistered: _registered.contains(_filtered[i].id),
                      onTap: () => _openModal(_filtered[i]),
                    ),
                  ),
                ),
        ),
      ]),
    );
  }
}

// ── Event list card ──────────────────────────────────────────────
class _EventCard extends StatelessWidget {
  final Event  event;
  final bool   isRegistered;
  final VoidCallback onTap;
  const _EventCard({required this.event, required this.isRegistered, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final scheme   = Theme.of(context).colorScheme;
    final isPodcast = event.youtubeLink != null;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        decoration: BoxDecoration(
          color: const Color(0xFF122C20),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isPodcast ? Colors.red.withValues(alpha: 0.5) : const Color(0xFF1E3F30),
          ),
          boxShadow: isPodcast ? [BoxShadow(color: Colors.red.withValues(alpha: 0.08), blurRadius: 16)] : null,
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(children: [
            // Icon
            Container(
              width: 56, height: 56,
              decoration: BoxDecoration(
                color: event.categoryColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Center(child: Text(event.iconEmoji, style: const TextStyle(fontSize: 26))),
            ),
            const SizedBox(width: 14),
            // Content
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(child: Text(event.title,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                    maxLines: 2, overflow: TextOverflow.ellipsis)),
                if (isPodcast)
                  Container(
                    margin: const EdgeInsets.only(left: 6),
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: Colors.red.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(6)),
                    child: const Text('🎥 YT', style: TextStyle(fontSize: 10, color: Colors.red)),
                  ),
              ]),
              const SizedBox(height: 4),
              Text('📅 ${event.formattedDate}   🕐 ${event.timeRange}',
                  style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
              Text('📍 ${event.location}',
                  style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
            ])),
            const SizedBox(width: 8),
            // Status badge
            if (isRegistered)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text('✓', style: TextStyle(color: Color(0xFFF59E0B), fontWeight: FontWeight.bold)),
              ),
          ]),
        ),
      ),
    );
  }
}

// ── Event detail modal ────────────────────────────────────────────
class _EventModal extends StatelessWidget {
  final Event ev;
  final bool isRegistered;
  final VoidCallback onToggle;
  const _EventModal({required this.ev, required this.isRegistered, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.7,
      maxChildSize: 0.95,
      builder: (_, ctrl) => SingleChildScrollView(
        controller: ctrl,
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            // Drag handle
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(
                color: Colors.white24, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 16),

            // Title
            Text('${ev.iconEmoji} ${ev.title}',
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),

            // Details
            _DetailRow(icon: Icons.person_outline,   text: ev.speaker),
            _DetailRow(icon: Icons.calendar_today,   text: ev.formattedDate),
            _DetailRow(icon: Icons.access_time,      text: ev.timeRange),
            _DetailRow(icon: Icons.location_on_outlined, text: ev.location),
            const SizedBox(height: 16),

            // YouTube link
            if (ev.youtubeLink != null) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.red.withValues(alpha: 0.08),
                  border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(children: [
                  const Text('🎥', style: TextStyle(fontSize: 22)),
                  const SizedBox(width: 10),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('YouTube Live Stream', style: TextStyle(fontWeight: FontWeight.bold)),
                    Text(ev.youtubeLink!, style: const TextStyle(color: Colors.redAccent, fontSize: 12)),
                  ])),
                  TextButton(
                    onPressed: () => launchUrl(Uri.parse(ev.youtubeLink!), mode: LaunchMode.externalApplication),
                    child: const Text('Watch', style: TextStyle(color: Colors.redAccent)),
                  ),
                ]),
              ),
              const SizedBox(height: 16),
            ],

            // Description
            Text(ev.description, style: const TextStyle(color: Color(0xFF9CA3AF), height: 1.6)),
            const SizedBox(height: 24),

            // Action buttons
            Row(children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFF1E3F30)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('Close'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () { Navigator.pop(context); onToggle(); },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isRegistered ? const Color(0xFFF59E0B) : scheme.primary,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: Text(isRegistered ? 'Cancel' : 'Register'),
                ),
              ),
            ]),
          ]),
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _DetailRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(children: [
      Icon(icon, size: 16, color: const Color(0xFF9CA3AF)),
      const SizedBox(width: 8),
      Text(text, style: const TextStyle(fontSize: 14)),
    ]),
  );
}
