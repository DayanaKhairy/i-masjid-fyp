// lib/services/supabase_service.dart

import 'dart:async';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/event.dart';

class SupabaseService {
  static final _client = Supabase.instance.client;

  // Cache current logged in profile
  static Map<String, dynamic>? _currentUserProfile;
  
  static Map<String, dynamic>? get currentUser => _currentUserProfile;

  // Stream controller to notify authentication status changes
  static final _authStateController = StreamController<bool>.broadcast();
  static Stream<bool> get authStateChanges => _authStateController.stream;

  // ── Auth (Direct Database Query Bypassing Supabase Auth) ───────
  
  static Future<bool> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _client
          .from('profiles')
          .select()
          .eq('email', email.trim())
          .eq('password', password)
          .maybeSingle();

      if (response != null) {
        _currentUserProfile = response;
        _authStateController.add(true);
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> signUp({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
  }) async {
    try {
      final response = await _client.from('profiles').insert({
        'first_name':   firstName.trim(),
        'last_name':    lastName.trim(),
        'email':        email.trim(),
        'phone_number': phone?.trim(),
        'password':     password,
      }).select().single();

      _currentUserProfile = response;
      _authStateController.add(true);
      return true;
    } catch (_) {
      return false;
    }
  }

  static Future<void> signOut() async {
    _currentUserProfile = null;
    _authStateController.add(false);
  }

  // ── Profiles ───────────────────────────────────────────────────
  static Future<Map<String, dynamic>?> getProfile(String email) async {
    try {
      final data = await _client
          .from('profiles')
          .select()
          .eq('email', email)
          .single();
      return data;
    } catch (_) {
      return null;
    }
  }

  // ── Events ────────────────────────────────────────────────────
  static Future<List<Event>> getEvents() async {
    try {
      final data = await _client
          .from('events')
          .select()
          .order('date', ascending: true);
      return (data as List).map((e) => Event.fromMap(e)).toList();
    } catch (_) {
      return [];
    }
  }

  // ── Registrations (Custom Direct Mappings) ─────────────────────
  static Future<Set<String>> getUserRegistrations(String email) async {
    try {
      final data = await _client
          .from('registrations')
          .select('event_id')
          .eq('email', email);
      return {for (var r in (data as List)) r['event_id'] as String};
    } catch (_) {
      return {};
    }
  }

  static Future<bool> registerForEvent(String eventId) async {
    final user = _currentUserProfile;
    if (user == null) return false;
    try {
      final String fullName = '${user['first_name']} ${user['last_name']}'.trim();
      await _client.from('registrations').insert({
        'event_id':     eventId,
        'name':         fullName,
        'email':        user['email'],
        'phone_number': user['phone_number'],
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> cancelRegistration(String eventId) async {
    final user = _currentUserProfile;
    if (user == null) return false;
    try {
      await _client
          .from('registrations')
          .delete()
          .eq('email', user['email'])
          .eq('event_id', eventId);
      return true;
    } catch (_) {
      return false;
    }
  }
}
