import 'package:cloud_firestore/cloud_firestore.dart';

class PostModel {
  final String id;
  final String creator;
  final String text;
  final Timestamp timestamp;
  final String like;
  final String originalId;
  final bool share;
  
  DocumentReference ref;

  int likesCount;
  int sharesCount;

  PostModel(
      {required this.id,
      required this.creator,
      required this.text,
      required this.timestamp,
      this.likesCount = 0,
      this.sharesCount = 0,
      this.originalId = '',
      this.share = false,
      this.like = '',
      required this.ref});
}