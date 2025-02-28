# Gérer les utilisateurs

Pour gérer les utilisateurs, vous devez accéder à la partie Administration.

Trouvez ensuite le bloc d'authentification.

![](/admin/auth-nav.png)

Vous pouvez accéder à la liste des utilisateurs en cliquant sur "Users" ou en ajouter un nouveau.

## Ajouter un utilisateur

Une fois que vous avez cliqué sur le bouton "Add", vous accédez au formulaire de création d'un utilisateur.

![](/admin/users-create.png)

Remplissez le formulaire avec un nom d'utilisateur (username), un mot de passe (password) fort et un niveau
d'expertise (expertise level). Vous devez communiquer le nom d'utilisateur et le mot de passe à l'utilisateur.

Vous pouvez ensuite lui indiquer de [modifier son mot de passe](../account.md#mettre-a-jour-le-mot-de-passe)

### Gestion des autorisations

Si l'utilisateur que vous avez créé est un annotateur. La création de l'utilisateur est terminée.

#### Créateur de campagne

Si vous avez créé un compte de créateur de campagne, dans le bloc "Permissions" :

- Cochez le statut "Staff" pour lui permettre de se connecter à la partie Administration.
  ![](/admin/users-status.png)
- Accordez-lui toutes les permissions liées au « label » et à la « confidence »
  ![](/admin/users-permissions.png)

#### Administrateur

Si vous avez créé un compte administrateur, dans le bloc "Permissions" :

- Cochez le statut « Staff » pour lui permettre de se connecter à la partie Administration.
- Cochez le statut « Superuser » pour lui accorder toutes les permissions.

![](/admin/users-status-admin.png)