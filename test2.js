import com.atlassian.crowd.embedded.api.User
import com.atlassian.jira.bc.issue.search.SearchService
import com.atlassian.jira.component.ComponentAccessor
import com.atlassian.jira.issue.Issue
import com.atlassian.jira.issue.IssueManager
import com.atlassian.jira.user.util.UserUtil
import com.atlassian.jira.web.bean.PagerFilter
import com.atlassian.jira.issue.fields.CustomField
import com.atlassian.jira.issue.CustomFieldManager

jqlSearch = "'Epic Link' = " + issue.getKey() + " and issuetype != 'Crate Planning Task' and 'Locked In Product' = 'Yes'"
SearchService searchService = ComponentAccessor.getComponent(SearchService.class)
UserUtil userUtil = ComponentAccessor.getUserUtil()
User user = ComponentAccessor.getJiraAuthenticationContext().getLoggedInUser()
IssueManager issueManager = ComponentAccessor.getIssueManager()

if (!user) {
    user = userUtil.getUserObject('jira_bot')
}

List<Issue> issues = null

SearchService.ParseResult parseResult = searchService.parseQuery(user, jqlSearch)
if (parseResult.isValid())
{
    def searchResult = searchService.search(user, parseResult.getQuery(), PagerFilter.getUnlimitedFilter())
    // Transform issues from DocumentIssueImpl to the "pure" form IssueImpl (some methods don't work with DocumentIssueImps)
    issues = searchResult.issues.collect {issueManager.getIssueObject(it.id)}
} else {
    log.error("Invalid JQL: " + jqlSearch);
}

CustomFieldManager cfManager = ComponentAccessor.getComponent(CustomFieldManager)
CustomField unitCost;
List<CustomField> cFields;
Double dValue;
double totalWeight = 0
for(int i=0; i < issues.size(); i++)
{
    Issue item = issues.get(i)
    cFields = cfManager.getCustomFieldObjects(item)

	for (int x = 0; x < cFields.size(); x++)
	{
    	if (cFields.get(x).getFieldName() == "Weight (oz)")
    	{
     	    unitCost = cFields.get(x)
			dValue = (Double)item.getCustomFieldValue(unitCost)
            if (dValue != null)
           		totalWeight = totalWeight + dValue.doubleValue()
        }
 	}
    
}
return totalWeight
