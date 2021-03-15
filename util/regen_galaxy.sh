#!/bin/bash
DATA_DEF_FILE=queries/data_definition_queries.sql
NUM_SYSTEMS=200

cp queries/create_tables.sql $DATA_DEF_FILE
echo -e "--\n-- SAMPLE DATA CREATION\n--\n" >> $DATA_DEF_FILE
node util/galaxy_generator.js $NUM_SYSTEMS >> $DATA_DEF_FILE
echo "" >> $DATA_DEF_FILE

