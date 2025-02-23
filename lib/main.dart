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
    createTicker((d) {
      milliSecondsPassed += 16;
      if (milliSecondsPassed % 20 == 0.0) {
        repaintNotifier.value = milliSecondsPassed;
      }
    }); //.start();
  }

  void loadMyShader() async {
    var program = await FragmentProgram.fromAsset('shaders/snowfall.frag');
    FragmentShader? shader = program.fragmentShader();
    weatherBgPaint.shader = shader;
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
                alignment: Alignment.center,
                child: Card(
                  child: Container(
                    padding: EdgeInsets.all(24),
                    child: Wrap(
                      crossAxisAlignment: WrapCrossAlignment.center,
                      direction: Axis.vertical,
                      children: [
                        Text("MY LOCATION"),
                        Text("Mt. Everest"),
                        Text("-32°"),
                        Text("Snowy"),
                        Text("H:-27°, L:-34°"),
                      ],
                    ),
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
