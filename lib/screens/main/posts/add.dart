import 'package:flutter/material.dart';
import 'package:shaxe/services/posts.dart';

class Add extends StatefulWidget {
  const Add({super.key});

  @override
  State<Add> createState() => _AddState();
}

class _AddState extends State<Add> {
  final PostService _postService = PostService();
  String text = '';
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Shaxe'),
        backgroundColor: Colors.deepPurple,
        actions:  <Widget>[
          TextButton(
            style: TextButton.styleFrom (foregroundColor: Colors.black), 
            onPressed: () async {
              _postService.savePost(text);
              Navigator.pop(context);
            }, child: const Text('post')),
        ],
        ),
        body: Container(
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 10),
          child: Form(child: TextFormField(
            onChanged: (val) {
              setState(() {
                text = val;
              });
            },
          )),
        ), 
    );
  }
}

class Appbar {
}