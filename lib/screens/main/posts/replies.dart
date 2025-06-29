import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shaxe/models/post.dart';
import 'package:shaxe/screens/main/posts/list.dart';
import 'package:shaxe/services/posts.dart';

class Replies extends StatefulWidget {
  const Replies({Key? key}) : super(key: key);

  @override
  _RepliesState createState() => _RepliesState();
}

class _RepliesState extends State<Replies> {
  PostService _postService = PostService();
  String text = '';
  TextEditingController _textController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final route = ModalRoute.of(context);
    final args = route?.settings.arguments as PostModel?;
    if (args == null) {
      return const Center(child: Text('No post data found.'));
    }
    return FutureProvider.value(
        value: _postService.getReplies(args),
        initialData: const [],
        child: Container(
          child: Scaffold(
            body: Container(
              child: Column(
                children: [
                  Expanded(child: ListPosts(args)),
                  Container(
                    padding: EdgeInsets.symmetric(vertical: 10, horizontal: 10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Form(
                            child: TextFormField(
                          controller: _textController,
                          onChanged: (val) {
                            setState(() {
                              text = val;
                            });
                          },
                        )),
                        SizedBox(
                          height: 10,
                        ),
                        TextButton(
                            style: TextButton.styleFrom(
                              foregroundColor: Colors.white,
                              backgroundColor: Colors.blue,
                            ),
                            onPressed: () async {
                              await _postService.reply(args, text);
                              _textController.text = '';
                              setState(() {
                                text = '';
                              });
                            },
                            child: Text("Reply"))
                      ],
                    ),
                  )
                ],
              ),
            ),
          ),
        ));
  }
}