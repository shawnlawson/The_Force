### Python

Simple, but assumes you've got Python (anyway you should if you are on OS X; if in doubt, just run `python --version`).

You can do this instantly, but you won't be able to use the microphone input (requires HTTPS)

```bash
cd /path/to/the_force
python -m SimpleHTTPServer 80    # or whatever other port you want.
```

**To use HTTPS with `SimpleHTTPServer` is actually pretty simple!** Just follow [these instructions](https://gist.github.com/dergachev/7028596). Then when you access the URL just don't forget the `https` in the URL. You'll have to "accept" the invalid HTTPS certificate, but that's fine, it's just little old you.

### Apache

##### this guide assumes you've not made a bunch of changes to the default apache2 config

- copy your cloned 'The_Force' directory into /Library/WebServer/Documents
    ```bash
    sudo -s
    mkdir /Library/WebServer/Documents/the_force (I chose the_force because I hate capitol letters)
    cp /path/to/git/repository/The_Force /Library/WebServer/Documents/the_force
    exit (to exit root shell)
    ```

- edit /etc/apache2/httpd.conf

- find the end of `'<Directory "/Library/WebServer/Documents/">'`, `'</Directory>'`, an insert the following: 

```
<Directory "/Library/WebServer/Documents/the_force">

    Options FollowSymLinks Multiviews
    MultiviewsMatch Any
    AllowOverride None

    #
    # Controls who can get stuff from this server.
    #
    Require all granted
</Directory>
```

- `sudo apachectl stop`
- `sudo apachectl start`

- navigate to http://localhost/
    you should see "it works!"

- navigate to http://localhost/the_force
    you should see The_Force IDE!

