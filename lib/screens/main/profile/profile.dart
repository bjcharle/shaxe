import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shaxe/screens/main/posts/list.dart';
import 'package:shaxe/services/posts.dart';

class Profile extends StatefulWidget {
  const Profile({super.key});

  @override
  State<Profile> createState() => _ProfileState();
}

class _ProfileState extends State<Profile> {
  PostService _postService = PostService();
  @override
  Widget build(BuildContext context) {
    return StreamProvider.value(
      initialData: [],
      value: _postService.getPostsByUser(FirebaseAuth.instance.currentUser?.uid), 
    child: Scaffold(
      body: Container(
        child: ListPosts(),
      ),
    ));
      }
}