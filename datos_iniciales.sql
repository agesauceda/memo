[10:02 pm, 8/4/2026] +504 9864-5921: SECRET_KEY=django-insecure-_v^2=9sgs^#11lsbv0=92#$l+if4z+325uyz0y=sns&s62p-!a
DB_NAME=memo_db
DB_PASSWORD=7654321
EMAIL_HOST_PASSWORD=owac kirf osen eaaq
[10:03 pm, 8/4/2026] +504 9864-5921: Y este es el contenido de datos_iniciales.sql:
-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: memo_db
-- ------------------------------------------------------
-- Server version	8.4.8

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table Cartas
--

LOCK TABLES Cartas WRITE;
/*!40000 ALTER TABLE Cartas DISABLE KEYS */;
INSERT INTO Cartas VALUES (1,1,'C#','images/categorias/cat_languages/c_sharp.png',1,1),(3,2,'Kotlin','images/categorias/cat_languages/kotlin.png',1,1),(5,3,'Go','images/categorias/cat_languages/go.png',1,1),(7,4,'Java','images/categorias/cat_languages/java.png',1,1),(9,5,'JavaScript','images/categorias/cat_languages/javascript.png',1,1),(11,6,'PHP','images/categorias/cat_languages/php.png',1,1),(13,7,'Python','images/categorias/cat_languages/python.png',1,1),(15,8,'Swift','images/categorias/cat_languages/swift.png',1,1),(17,1,'AWS','images/categorias/cat_tools/aws.png',1,2),(19,2,'Docker','images/categorias/cat_tools/docker.png',1,2),(21,3,'Firebase','images/categorias/cat_tools/firebase.png',1,2),(23,4,'GitHub','images/categorias/cat_tools/github.png',1,2),(25,5,'Postman','images/categorias/cat_tools/postman.png',1,2),(27,6,'Stackoverflow','images/categorias/cat_tools/stackoverflow.png',1,2),(29,7,'Terminal','images/categorias/cat_tools/terminal.png',1,2),(31,8,'VSCode','images/categorias/cat_tools/vscode.png',1,2),(33,1,'Angular','images/categorias/cat_frameworks/angular.png',1,3),(35,2,'Django','images/categorias/cat_frameworks/django.png',1,3),(37,3,'Laravel','images/categorias/cat_frameworks/laravel.png',1,3),(39,4,'React','images/categorias/cat_frameworks/React.png',1,3),(41,5,'Spring Boot','images/categorias/cat_frameworks/springboot.png',1,3),(43,6,'Tailwind','images/categorias/cat_frameworks/tailwindcss.png',1,3),(45,7,'TensorFlow','images/categorias/cat_frameworks/tensorflow.png',1,3),(47,8,'Vue.js','images/categorias/cat_frameworks/vuejs.png',1,3);
/*!40000 ALTER TABLE Cartas ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table Categorias_Juego
--

LOCK TABLES Categorias_Juego WRITE;
/*!40000 ALTER TABLE Categorias_Juego DISABLE KEYS */;
INSERT INTO Categorias_Juego VALUES (1,'Básico',6,60,4,4),(2,'Medio',4,45,4,4),(3,'Avanzado',2,30,4,4);
/*!40000 ALTER TABLE Categorias_Juego ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table Rangos
--

LOCK TABLES Rangos WRITE;
/*!40000 ALTER TABLE Rangos DISABLE KEYS */;
INSERT INTO Rangos VALUES (1,'Sin Rango',0,499,1),(2,'Bronce',500,999,2),(3,'Plata',1000,2999,3),(4,'Oro',3000,5000,4);
/*!40000 ALTER TABLE Rangos ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-05  0:16:02