#!/usr/bin/env bash

function build() {
  mkdir -p deploy/css/
  jade index.jade --out deploy/
  stylus css/style.styl --out deploy/css/
  cp css/unsemantic-grid-responsive.css deploy/css/
}

function deploy() {
  if [ ! -d "deploy/" ]; then return; fi

  git checkout gh-pages

  mv deploy/css/* ./css
  mv deploy/index.html .

  rm -rf deploy/

  git add css/ index.html
  git commit -m "Update page to commit `git rev-parse --short master`"

  git checkout master
}

if [ $1 == "build" ]; then
  build
elif [ $1 == "deploy" ]; then
  deploy
else
  build
  deploy
fi
