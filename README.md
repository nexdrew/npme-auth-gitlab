# npme-auth-gitlab

> Login to npm Enterprise using GitLab credentials

Based on [GitLab's API](https://github.com/gitlabhq/gitlabhq/tree/master/doc/api)

To install on your npm Enterprise instance:

1. `cd /usr/local/lib/npme/data` (or the directory configured for _Miscellaneous data files_ in the admin console)

2. `sudo npm i npme-auth-gitlab`

3. `sudo touch gitlab.json` and populate it with data like the following:

    ```json
    {
      "url": "https://gitlab.example.com",
      "strictSSL": false
    }
    ```

    Point the `"url"` to your GitLab instance. If it's using https with a self-signed cert, then make sure `"strictSSL"` is `false`.

4. Go to your npm Enterprise admin console (on port 8800 of your server), go to Settings, select _Custom_ for _Authentication_, and populate each plugin value as `/etc/npme/data/node_modules/npme-auth-gitlab`

5. Save settings and use the prompt to restart the appliance. Done!
