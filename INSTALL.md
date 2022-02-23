## PostgreSQL Database

From postgres user:

```
createuser -Pse USER_NAME_HERE
MY_USER_NAME=user_name_here
MY_DATABASE=database_name_here
createdb --owner=$MY_USER_NAME --encoding=UTF8 $MY_DATABASE
```

Check with `psql -U postgres -c "\l"`

## Deploy
### Deploy keys

Follow [GitHub instructions to use read-only deploy keys](https://docs.github.com/en/developers/overview/managing-deploy-keys#using-multiple-repositories-on-one-server).

Add to ~/.ssh/config:

```
Host github.com-wmch-interactive-maps
   Hostname github.com
   IdentityFile=~/.ssh/path_to_private_key
```
### Clone repository

`git clone git@github.com-wmch-interactive-maps:synapta/wmch-interactive-maps.git`


### Pull from repository

`git pull`


### Push

Push is not available with read-only keys.
