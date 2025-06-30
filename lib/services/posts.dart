import 'dart:developer';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:shaxe/models/post.dart';
import 'package:shaxe/services/user.dart';
import 'package:quiver/iterables.dart' as quiver;


class PostService {
  List<PostModel> _postListFromSnapshot(QuerySnapshot snapshot) {
    return snapshot.docs.map((doc) {
      return PostModel(
        id: doc.id,
        text: (doc.data() as Map<String, dynamic>)['text'] ?? '',
        creator: (doc.data() as Map<String, dynamic>)['creator'] ?? '',
        timestamp: (doc.data() as Map<String, dynamic>)['timestamp'] ?? 0,
        likesCount: (doc.data() as Map<String, dynamic>)['likesCount'] ?? 0,
        sharesCount: (doc.data() as Map<String, dynamic>)['sharesCount'] ?? 0,
        share: (doc.data() as Map<String, dynamic>)['retweet'] ?? false,
        originalId: (doc.data() as Map<String, dynamic>)['originalId'] ?? null,
        ref: doc.reference,
      );
    }).toList();
  }

  PostModel _postFromSnapshot(DocumentSnapshot snapshot) {
    final data = snapshot.data();
    if (!snapshot.exists || data == null) {
      // Return a default PostModel or throw an exception as per your app logic
      return PostModel(
        id: snapshot.id,
        text: '',
        creator: '',
        timestamp: Timestamp.now(),
        likesCount: 0,
        sharesCount: 0,
        share: false,
        originalId: '',
        ref: snapshot.reference,
      );
    }
    final map = data as Map<String, dynamic>;
    return PostModel(
      id: snapshot.id,
      text: map['text'] ?? '',
      creator: map['creator'] ?? '',
      timestamp: map['timestamp'] ?? 0,
      likesCount: map['likesCount'] ?? 0,
      sharesCount: map['retweetsCount'] ?? 0,
      share: map['retweet'] ?? false,
      originalId: map['originalId'] ?? null,
      ref: snapshot.reference,
    );
  }

  Future savePost(text) async {
    await FirebaseFirestore.instance.collection("posts").add({
      'text': text,
      'creator': FirebaseAuth.instance.currentUser!.uid,
      'timestamp': FieldValue.serverTimestamp(),
      'retweet': false
    });
  }

  Future reply(PostModel post, String text) async {
    if (text == '') {
      return;
    }
    await post.ref.collection("replies").add({
      'text': text,
      'creator': FirebaseAuth.instance.currentUser!.uid,
      'timestamp': FieldValue.serverTimestamp(),
      'retweet': false
    });
  }

  Future likePost(PostModel post, bool current) async {
    print(post.id);
    if (current) {
      post.likesCount = post.likesCount - 1;
      await FirebaseFirestore.instance
          .collection("posts")
          .doc(post.id)
          .collection("likes")
          .doc(FirebaseAuth.instance.currentUser!.uid)
          .delete();
    }
    if (!current) {
      post.likesCount = post.likesCount + 1;
      await FirebaseFirestore.instance
          .collection("posts")
          .doc(post.id)
          .collection("likes")
          .doc(FirebaseAuth.instance.currentUser!.uid)
          .set({});
    }
  }

  Future retweet(PostModel post, bool current) async {
    if (current) {
      post.sharesCount = post.sharesCount - 1;
      await FirebaseFirestore.instance
          .collection("posts")
          .doc(post.id)
          .collection("retweets")
          .doc(FirebaseAuth.instance.currentUser!.uid)
          .delete();

      await FirebaseFirestore.instance
          .collection("posts")
          .where("originalId", isEqualTo: post.id)
          .where("creator", isEqualTo: FirebaseAuth.instance.currentUser!.uid)
          .get()
          .then((value) {
        if (value.docs.length == 0) {
          return;
        }
        FirebaseFirestore.instance
            .collection("posts")
            .doc(value.docs[0].id)
            .delete();
      });
      // Todo remove the retweet
      return;
    }
    post.sharesCount = post.sharesCount + 1;
    await FirebaseFirestore.instance
        .collection("posts")
        .doc(post.id)
        .collection("retweets")
        .doc(FirebaseAuth.instance.currentUser!.uid)
        .set({});

    await FirebaseFirestore.instance.collection("posts").add({
      'creator': FirebaseAuth.instance.currentUser!.uid,
      'timestamp': FieldValue.serverTimestamp(),
      'retweet': true,
      'originalId': post.id
    });
  }

  Stream<bool> getCurrentUserLike(PostModel post) {
    return FirebaseFirestore.instance
        .collection("posts")
        .doc(post.id)
        .collection("likes")
        .doc(FirebaseAuth.instance.currentUser!.uid)
        .snapshots()
        .map((snapshot) {
      return snapshot.exists;
    });
  }

  Stream<bool> getCurrentUserRetweet(PostModel post) {
    return FirebaseFirestore.instance
        .collection("posts")
        .doc(post.id)
        .collection("retweets")
        .doc(FirebaseAuth.instance.currentUser!.uid)
        .snapshots()
        .map((snapshot) {
      return snapshot.exists;
    });
  }

  Future<PostModel> getPostById(String id) async {
    DocumentSnapshot postSnap =
        await FirebaseFirestore.instance.collection("posts").doc(id).get();

    return _postFromSnapshot(postSnap);
  }

  Stream<List<PostModel>> getPostsByUser(uid) {
    return FirebaseFirestore.instance
        .collection("posts")
        .where('creator', isEqualTo: uid)
        .snapshots()
        .map(_postListFromSnapshot);
  }

  Future<List<PostModel>> getReplies(PostModel post) async {
    QuerySnapshot querySnapshot = await post.ref
        .collection("replies")
        .orderBy('timestamp', descending: true)
        .get();

    return _postListFromSnapshot(querySnapshot);
  }

  Future<List<PostModel>> getFeed() async {
    List<String> usersFollowing = await UserService() //['uid1', 'uid2']
        .getUserFollowing(FirebaseAuth.instance.currentUser!.uid);

    var splitUsersFollowing = quiver.partition<dynamic>(usersFollowing, 10);
    inspect(splitUsersFollowing);

    List<PostModel> feedList = [];

    for (int i = 0; i < splitUsersFollowing.length; i++) {
      inspect(splitUsersFollowing.elementAt(i));
      QuerySnapshot querySnapshot = await FirebaseFirestore.instance
          .collection('posts')
          .where('creator', whereIn: splitUsersFollowing.elementAt(i))
          .orderBy('timestamp', descending: true)
          .get();

      feedList.addAll(_postListFromSnapshot(querySnapshot));
    }

    feedList.sort((a, b) {
      var adate = a.timestamp;
      var bdate = b.timestamp;
      return bdate.compareTo(adate);
    });

    return feedList;
  }
}