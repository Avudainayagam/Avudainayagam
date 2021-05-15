module.exports = {
    "apps": [
        {
            "script": "server.js",
            "instances": "1",
            "exec_mode": "cluster",
            "name": "primary",
            "max_memory_restart":"300M",
            "env_production": {
                "name": "api_prod",
                "PORT": 9060,
                "NODE_ENV": "production"
            }
        },
        {
            "script": "server.js",
            "instances": "3",
            "exec_mode": "cluster",
            "name": "replica",
            "max_memory_restart":"300M",
            "env_production": {
                "name": "api_prod",
                "PORT": 9060,
                "NODE_ENV": "production"
            }
        }
    ]
}
