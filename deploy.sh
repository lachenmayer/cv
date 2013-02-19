#!/usr/bin/env bash

mkdir -p deploy/css/
jade index.jade --out deploy/
sass css/style.sass deploy/css/style.css
cp css/unsemantic-grid-responsive.css deploy/css/

git checkout gh-pages

mv deploy/css/* ./css
mv deploy/index.html .

rm -rf deploy/

git add css/ index.html
git commit -m "Update page to commit `git rev-parse --short master`"

git checkout master

