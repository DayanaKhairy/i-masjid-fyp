import 'package:flutter/material.dart';

// lib/models/event.dart

class Event {
  final String  id;
  final String  title;
  final String  description;
  final String  category;
  final String  date;
  final String  timeRange;
  final String  speaker;
  final String  location;
  final String  iconEmoji;
  final String? youtubeLink;
  bool          isRegistered;

  Event({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.date,
    required this.timeRange,
    required this.speaker,
    required this.location,
    required this.iconEmoji,
    this.youtubeLink,
    this.isRegistered = false,
  });

  factory Event.fromMap(Map<String, dynamic> map) {
    return Event(
      id:          map['id']          as String,
      title:       map['title']       as String? ?? '',
      description: map['description'] as String? ?? '',
      category:    map['category']    as String? ?? 'religious',
      date:        map['date']        as String? ?? '',
      timeRange:   map['time_range']  as String? ?? '',
      speaker:     map['speaker']     as String? ?? '',
      location:    map['location']    as String? ?? '',
      iconEmoji:   map['icon_emoji']  as String? ?? '📅',
      youtubeLink: map['youtube_link'] as String?,
    );
  }

  String get formattedDate {
    try {
      final d = DateTime.parse(date);
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return '${d.day} ${months[d.month - 1]} ${d.year}';
    } catch (_) { return date; }
  }

  Color get categoryColor {
    switch (category) {
      case 'religious':  return const Color(0xFF10B981);
      case 'education':  return const Color(0xFF3B82F6);
      case 'community':  return const Color(0xFFF59E0B);
      case 'charity':    return const Color(0xFFEC4899);
      default:           return const Color(0xFF9CA3AF);
    }
  }
}
