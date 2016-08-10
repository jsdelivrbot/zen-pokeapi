# Pokemon App

Application de test sur pokeapi.co
Pour un lancement plus aisé, un fichier docker-compose.yml a été créé.

L'application a été développée sous Google Chrome sous MacOs.

### Pré-requis
- Docker & docker-compose
 
### Lancement 

Un script launch.sh est présent à la racine, il s'occupe de :
* créer les images Docker nécessaires
* remplacer l'adresse ip de la machine docker dans un fichier de config pour la partie front (dans le cas de Windows/MacOs, Docker tourne sous virtualbox et son adresse ip est différente de localhost)
* lancer via docker-compose up

Il suffit donc de lancer les commandes :
* `chmod +x launch.sh`
* `./launch.sh`

Le build initial peut prendre quelques minutes suivant la connexion.

Accéder à l'application via l'ip de la machine docker :
- docker-machine ip

(sous MacOs : http://192.168.99.100/)


### Sources

Les sources sont présentes dans le dossier sources :
* pokemon : partie serveur (java via sprintboot)
* pokemon-ui : partie front (angularjs)