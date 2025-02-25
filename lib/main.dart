import 'dart:io';
import 'dart:ui';

import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Weather',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const MyHomePage(title: 'Weather app'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});

  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> with TickerProviderStateMixin {
  Paint weatherBgPaint = Paint();
  ValueNotifier<double> repaintNotifier = ValueNotifier(0);
  double milliSecondsPassed = 0;

  @override
  void initState() {
    super.initState();
    loadMyShader();
  }

  void loadMyShader() async {
    var program = await FragmentProgram.fromAsset('shaders/snowfall.frag');
    FragmentShader? shader = program.fragmentShader();
    weatherBgPaint.shader = shader;
    createTicker((d) {
      milliSecondsPassed += 16;
      repaintNotifier.value = milliSecondsPassed;
      ///use code block below instead of above line, for simulators for better frame rate
      /*if (milliSecondsPassed % 20 == 0.0) {
        repaintNotifier.value = milliSecondsPassed;
      }*/
    }).start();
    print("shader load finished");
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        child: Stack(
          children: [
            Positioned.fill(
                child: CustomPaint(
              painter: WeatherBg(weatherBgPaint, repaintNotifier),
            )),
            Align(
              alignment: Alignment.center,
              child: Container(
                decoration: BoxDecoration(
                  color: Color(0x75ffffff),
                  borderRadius: BorderRadius.circular(15),
                  border: Border.all(color: Color(0xffdedede), width: 0.5)
                ),
                // surfaceTintColor: Colors.white,
                child: Container(
                  padding: EdgeInsets.symmetric(vertical: 24, horizontal: 40),
                  child: Wrap(
                    crossAxisAlignment: WrapCrossAlignment.center,
                    direction: Axis.vertical,
                    children: [
                      Text("MY LOCATION", style: TextStyle(fontSize: 13)),
                      SizedBox(height: 2),
                      Text("Mt. Everest", style: TextStyle(fontSize: 24, fontWeight: FontWeight.w500)),
                      SizedBox(height: 8),
                      Text("-32°", style: TextStyle(fontSize: 57)),
                      SizedBox(height: 8),
                      Text("Snowy", style: TextStyle(fontSize: 17, fontWeight: FontWeight.w500)),
                      SizedBox(height: 4),
                      Text("H:-27° L:-34°", style: TextStyle(fontSize: 17)),
                    ],
                  ),
                ),
              ),
            )
          ],
        ),
      ),
    );
  }
}

class WeatherBg extends CustomPainter {
  Paint paintObj;
  ValueNotifier<double> repaint;
  static double inverter = Platform.isIOS ? -1 : 1;

  WeatherBg(this.paintObj, this.repaint) : super(repaint: repaint);

  @override
  void paint(Canvas canvas, Size size) {
    if (paintObj.shader != null) {
      var shader = (paintObj.shader as FragmentShader);
      shader.setFloat(0, size.width);
      shader.setFloat(1, size.height);
      shader.setFloat(2, repaint.value / 1000);
      shader.setFloat(3, inverter);
    }
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), paintObj);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    return true;
  }
}
