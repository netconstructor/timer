from __future__ import print_function
import datetime

from fabric.operations import local, run
from fabric.context_managers import cd, lcd
from pathtools import path
from pathtools import patterns
from jinja2 import Template

from config import config_dev, config_stage
from jinja import JinjaTemplateProcessor


FAVICONS = {
        'ico': {
            'size': 32,
            'name': 'favicon.ico',
            },
        'apple-57': {
            'size': 57,
            'name': 'apple-touch-icon-precomposed.png',
            },
        'apple-72': {
            'size': 72,
            'name': 'apple-touch-icon-72x72-precomposed.png',
            },
        'apple-114': {
            'size': 114,
            'name': 'apple-touch-icon-114x114-precomposed.png',
            },
        'apple-144': {
            'size': 144,
            'name': 'apple-touch-icon-144x144-precomposed.png',
            },
        'fb': {
            'size': 300,
            'name': 'opengraph-icon.png',
            },
        }


def make_favicons():
    with lcd("app/assets/favicons/"):
        for k, v in FAVICONS.items():
            local("convert favicon.svg -resize %s %s" % (v['size'], v['name']))


def process_templates(source_path, dest_path, config):
    for found in path.walk(path.absolute_path(source_path)):
        for file_name in found[2]:
            real_file_name = "%s/%s" % (found[0], file_name)
            if patterns.match_path(real_file_name, ["*.tpl.html"]):
                template_processor = JinjaTemplateProcessor()

                output_dir = template_processor.mkdirs(real_file_name,
                        path.absolute_path(dest_path),
                        path.absolute_path(source_path))

                output_file = template_processor.write_templates(
                        real_file_name,
                        output_dir,
                        config=config)

                print("jinja wrote file {0}/{1}".format(output_dir,
                    output_file))


def minify():
    for files in (config_dev.css, config_dev.javascripts_header,
            config_dev.javascripts_footer):
        unminified_files = []
        minified_files = []
        for file_name in files:
            if '//' in file_name:  # this is a URL and we shouldn't minify
                unminified_files.append(file_name)
            else:  # we need to minify
                with lcd("stage"):
                    print("minifying {0}".format(file_name))


def process_file_groups(groups,
        date=datetime.datetime.now().strftime("%Y%m%d%H%M%S")):
    processed_groups = {}
    for k,group in groups.iteritems():
        processed_individuals = []
        for individual in group:
            processed_individuals.append(individual.format(date=date))
        temp_group = { str(k): processed_individuals }
        processed_groups.update(temp_group)

    return processed_groups


def prepare_deploy():
    make_favicons()
    local("rm -rf stage")
    local("mkdir stage")
    local("cp -fR app/* stage/")
    asset_groups = {
            "css": config_stage.css,
            "javascripts_header": config_stage.javascripts_header,
            "javascripts_footer": config_stage.javascripts_footer
            }
    processed_groups = process_file_groups(asset_groups)

    process_templates(config_stage.source_path,
            config_stage.dest_path,
            config=processed_groups)

def deploy():
    make_favicons()
    local("cp -fR app/* deploy/")
    with lcd("deploy"):
        local("git add .")
        local("git commit -a -m 'Update %s'" % datetime.datetime.now())
        local("git push origin gh-pages")
