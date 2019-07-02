#!/bin/bash

set -e

# ENV_FILE="${1:-/}/env.js"
ENV_FILE="/tmp/env.js"

echo "window.env = {" > "$ENV_FILE"

saveEnv(){
    while IFS="=" read a b; do
        VALUE=$(echo $b | xargs)
        # echo window.env.$a = \"$VALUE\" >> "$ENV_FILE"
        echo "  $a: '$VALUE'," >> "$ENV_FILE"
    done <<< "$1"
}

env | grep REACT_APP_ | while read -r line ; do
    saveEnv "$line"
done

if test -f ".env"; then
    cat .env | while read -r line ; do
        saveEnv "$line"
    done
fi

echo "}" >> "$ENV_FILE"

ENVS=$(cat $ENV_FILE | tr $'\n' ' ')

sed -i.bak "s|<script data-envs></script>|<script data-envs>$ENVS</script>|" ./index.html

cat "$ENV_FILE"
